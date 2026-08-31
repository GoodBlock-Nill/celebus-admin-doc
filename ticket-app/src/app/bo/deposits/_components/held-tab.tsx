'use client';

import { useMemo, useState } from 'react';
import { formatKrw } from '@/lib/format';
import { useTicketStore } from '@/lib/store';
import { DataTable } from '../../_components/data-table';
import type { Column } from '../../_components/data-table';
import { Button, Select, TextInput } from '../../_components/form';
import { useToast } from '../../_components/toast';
import { InfoNote } from '../../_components/ui';
import {
  amountColumn,
  depositedAtColumn,
  depositorColumn,
  memoColumn,
  orderColumn,
  statusColumn,
} from './deposit-columns';
import { matchableOrders } from './deposit-rows';
import type { DepositRow } from './deposit-rows';

const DEFAULT_REFUND_MEMO = '입금 마감 이후 입금 — 반환 대상';

type ActionKind = 'match' | 'refund';
interface ActiveAction {
  depositId: string;
  kind: ActionKind;
}

/** ② 보류 — 이름·금액이 어긋나 운영자 판단이 필요한 입금 */
export function HeldTab({ rows }: { rows: DepositRow[] }) {
  const orders = useTicketStore((state) => state.orders);
  const verifications = useTicketStore((state) => state.verifications);
  const confirmDeposit = useTicketStore((state) => state.confirmDeposit);
  const manualMatch = useTicketStore((state) => state.manualMatch);
  const markRefundTarget = useTicketStore((state) => state.markRefundTarget);
  const toast = useToast();

  const [active, setActive] = useState<ActiveAction | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [memo, setMemo] = useState(DEFAULT_REFUND_MEMO);

  const candidates = useMemo(() => matchableOrders(orders), [orders]);

  const openAction = (depositId: string, kind: ActionKind) => {
    setActive((current) =>
      current && current.depositId === depositId && current.kind === kind ? null : { depositId, kind },
    );
    if (kind === 'match') setSelectedOrderId(candidates[0]?.id ?? '');
    if (kind === 'refund') setMemo(DEFAULT_REFUND_MEMO);
  };

  const candidateLabel = (orderId: string): string => {
    const order = candidates.find((item) => item.id === orderId);
    if (!order) return '';
    const realName = verifications.find((item) => item.userId === order.userId)?.realName ?? '실명 미확인';
    return `${order.orderNo} · ${realName} · ${order.qty}매 · ${formatKrw(order.amountKrw)}`;
  };

  const columns: Array<Column<DepositRow>> = [
    depositorColumn,
    amountColumn,
    depositedAtColumn,
    statusColumn,
    memoColumn,
    orderColumn,
    {
      key: 'action',
      header: '처리',
      align: 'right',
      width: '190px',
      render: (row) => (
        <div className="flex flex-wrap justify-end gap-1.5">
          {row.order ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                const result = confirmDeposit(row.deposit.id);
                toast.fromResult(
                  result,
                  `주문 ${row.order?.orderNo ?? ''} 입금 확정 — 티켓 ${row.order?.qty ?? 0}매를 지급했습니다.`,
                );
              }}
            >
              입금 확인
            </Button>
          ) : null}
          <Button size="sm" onClick={() => openAction(row.deposit.id, 'match')}>
            수동 매칭
          </Button>
          <Button variant="danger" size="sm" onClick={() => openAction(row.deposit.id, 'refund')}>
            환불 대상 지정
          </Button>
        </div>
      ),
    },
  ];

  const renderSubRow = (row: DepositRow) => {
    if (!active || active.depositId !== row.deposit.id) return null;

    if (active.kind === 'match') {
      return (
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex min-w-[280px] flex-1 flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-[#4A4E5A]">연결할 주문 선택</span>
            <Select value={selectedOrderId} onChange={(event) => setSelectedOrderId(event.target.value)}>
              {candidates.length === 0 ? <option value="">연결 가능한 주문이 없습니다</option> : null}
              {candidates.map((order) => (
                <option key={order.id} value={order.id}>
                  {candidateLabel(order.id)}
                </option>
              ))}
            </Select>
          </div>
          <Button
            variant="primary"
            disabled={!selectedOrderId}
            onClick={() => {
              const result = manualMatch(row.deposit.id, selectedOrderId);
              toast.fromResult(result, `${row.deposit.depositorName} 입금을 선택한 주문에 연결했습니다.`);
              if (result.ok) setActive(null);
            }}
          >
            주문에 연결
          </Button>
          <Button onClick={() => setActive(null)}>닫기</Button>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-[280px] flex-1 flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-[#4A4E5A]">반환 사유</span>
          <TextInput value={memo} onChange={(event) => setMemo(event.target.value)} />
        </div>
        <Button
          variant="danger"
          onClick={() => {
            const result = markRefundTarget(row.deposit.id, memo.trim() || DEFAULT_REFUND_MEMO);
            toast.fromResult(result, `${row.deposit.depositorName} 입금을 반환 대상으로 지정했습니다.`);
            if (result.ok) setActive(null);
          }}
        >
          반환 대상으로 지정
        </Button>
        <Button onClick={() => setActive(null)}>닫기</Button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <InfoNote tone="warning">
        금액만 맞고 입금자명이 다른 건은 자동으로 보류됩니다. 동명이인·대리 입금은 주문을 확인한 뒤 수동 매칭하고,
        예매와 무관한 입금은 반환 대상으로 지정하세요.
      </InfoNote>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.deposit.id}
        emptyText="보류 중인 입금이 없습니다."
        minWidth="1020px"
        renderSubRow={renderSubRow}
      />
    </div>
  );
}
