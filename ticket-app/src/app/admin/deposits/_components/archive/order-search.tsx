'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { DataTable } from '../../../_components/data-table';
import { Button, Select, TextInput } from '../../../_components/form';
import { ORDER_STATUS_VIEW } from '../../../_components/labels';
import { useToast } from '../../../_components/toast';
import { Card } from '../../../_components/ui';
import { buildOrderSearchColumns } from './order-search-columns';
import { OrderSearchDetail } from './order-search-detail';
import { adminApi } from '@/lib/admin-client';
import type { AdminOrderSearchView } from '@/lib/admin-types';
import type { OrderStatus } from '@/lib/api-types';

const MAX_KEYWORD_LENGTH = 40;

/** 상태 필터 선택지 — 자동 취소·티켓 지급·환불 완료까지 전 구간 */
const STATUS_OPTIONS: Array<{ value: '' | OrderStatus; label: string }> = [
  { value: '', label: '전체 상태' },
  { value: 'AWAITING_DEPOSIT', label: ORDER_STATUS_VIEW.AWAITING_DEPOSIT.label },
  { value: 'DEPOSIT_REPORTED', label: ORDER_STATUS_VIEW.DEPOSIT_REPORTED.label },
  { value: 'ON_HOLD', label: ORDER_STATUS_VIEW.ON_HOLD.label },
  { value: 'DEPOSIT_CONFIRMED', label: ORDER_STATUS_VIEW.DEPOSIT_CONFIRMED.label },
  { value: 'PAID', label: ORDER_STATUS_VIEW.PAID.label },
  { value: 'EXPIRED', label: ORDER_STATUS_VIEW.EXPIRED.label },
  { value: 'CANCEL_REQUESTED', label: ORDER_STATUS_VIEW.CANCEL_REQUESTED.label },
  { value: 'REFUNDED', label: ORDER_STATUS_VIEW.REFUNDED.label },
];

interface SearchState {
  items: AdminOrderSearchView[];
  total: number;
  page: number;
  pageSize: number;
}

/** 실제 조회에 쓰는 조건 — 검색어는 [조회]·상태 변경 시점에 반영된다 */
interface SearchQuery {
  keyword: string;
  status: '' | OrderStatus;
  page: number;
}

const EMPTY: SearchState = { items: [], total: 0, page: 1, pageSize: 20 };

/** 주문 조회 (재설계서 D-8) — 처리 큐에 걸리지 않는 예매까지 예매번호·실명으로 찾는다 */
export function OrderSearchSection() {
  const toast = useToast();
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState<SearchQuery>({ keyword: '', status: '', page: 1 });
  const [state, setState] = useState<SearchState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    setLoading(true);

    void adminApi
      .orders({
        keyword: query.keyword,
        statuses: query.status ? [query.status] : [],
        page: query.page,
      })
      .then((result) => {
        if (!isActive) return;
        setLoading(false);
        if (result.ok) setState(result.data);
        else toast.error(result.reason);
      });

    return () => {
      isActive = false;
    };
  }, [query, toast]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuery((current) => ({ ...current, keyword, page: 1 }));
  };

  const movePage = (delta: number) =>
    setQuery((current) => ({ ...current, page: current.page + delta }));

  const lastPage = Math.max(1, Math.ceil(state.total / state.pageSize));

  return (
    <Card
      title="주문 조회"
      description="예매번호·주문자 실명으로 전 구간을 찾습니다. 자동 취소·티켓 지급 완료·환불 완료 예매까지 포함되어 고객 문의에 바로 답할 수 있습니다."
    >
      <div className="flex flex-col gap-3">
        <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
          <div className="flex min-w-[240px] flex-1 flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-[#4A4E5A]">예매번호 · 주문자 실명</span>
            <TextInput
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              maxLength={MAX_KEYWORD_LENGTH}
              placeholder="예) T260901-0001 또는 홍길동"
            />
          </div>
          <div className="flex min-w-[160px] flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-[#4A4E5A]">상태</span>
            <Select
              value={query.status}
              onChange={(event) =>
                // 상태를 바꾸면 지금 입력해 둔 검색어까지 함께 반영한다.
                setQuery({ keyword, status: event.target.value as '' | OrderStatus, page: 1 })
              }
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? '조회 중…' : '조회'}
          </Button>
        </form>

        <DataTable
          columns={buildOrderSearchColumns(expandedId, (orderId) =>
            setExpandedId((current) => (current === orderId ? null : orderId)),
          )}
          rows={state.items}
          rowKey={(order) => order.id}
          emptyText="조건에 맞는 예매가 없습니다."
          minWidth="960px"
          renderSubRow={(order) =>
            expandedId === order.id ? <OrderSearchDetail order={order} /> : null
          }
        />

        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] text-[#6B7080]">
            전체 <span className="tabular-nums">{state.total}</span>건 · {state.page}/{lastPage} 쪽
          </span>
          <div className="flex gap-1.5">
            <Button size="sm" disabled={query.page <= 1} onClick={() => movePage(-1)}>
              이전
            </Button>
            <Button size="sm" disabled={query.page >= lastPage} onClick={() => movePage(1)}>
              다음
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
