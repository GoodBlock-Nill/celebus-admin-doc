'use client';

import Link from 'next/link';
import { useCallback } from 'react';

import { CheckIcon, ChevronRightIcon } from './icons';
import { orderTabOf } from './status-meta';
import { CARD, NUMERIC } from './ui';
import { useApiResource } from './use-api-resource';
import { api } from '@/lib/api-client';
import type { MeView, OrderSummaryView } from '@/lib/api-types';
import { kstParts } from '@/lib/time';

/** 마감 시각을 "HH:MM 마감" 표기로 줄인다 */
function deadlineLabelOf(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  const { hour, minute } = kstParts(parsed);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} 마감`;
}

/** 상태 요약 타일 — 라벨 + 큰 숫자 */
function StatTile({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[#F7F7FA] px-4 py-3.5">
      <span className="text-[14px] font-semibold text-[#4E5968]">{label}</span>
      <span className={`text-[22px] font-bold text-[#191F28] ${NUMERIC}`}>{count}</span>
    </div>
  );
}

/**
 * 홈 유저 상태 카드 — 홈이 "공연 목록"보다 먼저 "내 상태"로 읽히도록
 * 인사말·본인확인 신뢰 표시·예매 현황 요약·입금 마감 경고를 한 카드에 담는다.
 */
export function MyStatusCard({ me }: { me: MeView }) {
  const loadOrders = useCallback(() => api.orders(), []);
  const { state } = useApiResource(loadOrders);

  const orders: OrderSummaryView[] = state.status === 'READY' ? state.data.orders : [];
  const ongoingCount = orders.filter((order) => orderTabOf(order.status) === 'ONGOING').length;
  const paidCount = orders.filter((order) => order.status === 'PAID').length;
  const awaiting = orders
    .filter((order) => order.status === 'AWAITING_DEPOSIT')
    .sort((a, b) => a.depositDeadline.localeCompare(b.depositDeadline));

  return (
    <section className={`${CARD} p-4`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="min-w-0 truncate text-[18px] font-bold text-[#191F28]">
          안녕하세요, {me.nickname || '회원'}님
        </h2>
        <span className="flex shrink-0 items-center gap-1 text-[12.5px] font-bold text-[#D6336C]">
          <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#D6336C]">
            <CheckIcon className="h-3 w-3 text-white" />
          </span>
          본인확인 완료
        </span>
      </div>

      <p className="mt-3.5 text-[14.5px] font-bold text-[#191F28]">내 예매 현황</p>
      <div className="mt-2 grid grid-cols-2 gap-2.5">
        <StatTile label="진행 중" count={ongoingCount} />
        <StatTile label="티켓 지급" count={paidCount} />
      </div>

      {awaiting.length > 0 ? (
        <div className="mt-2.5 flex items-center justify-between gap-3 rounded-xl border border-[#E7A8BF] bg-[#FDF2F7] py-2.5 pl-3.5 pr-2.5">
          <p className="min-w-0 text-[13.5px] text-[#4E5968]">
            <span className="font-bold text-[#D6336C]">입금 대기 {awaiting.length}건</span>
            <span aria-hidden="true"> · </span>
            <span className={NUMERIC}>{deadlineLabelOf(awaiting[0].depositDeadline)}</span>
          </p>
          <Link
            href={`/app/orders/${awaiting[0].id}`}
            className="shrink-0 rounded-lg bg-[#D6336C] px-3.5 py-2 text-[13.5px] font-bold text-white"
          >
            입금하기
          </Link>
        </div>
      ) : null}

      <div className="mt-3 flex justify-end">
        <Link
          href="/app/orders"
          className="flex items-center gap-0.5 text-[14px] font-semibold text-[#191F28]"
        >
          예매내역 보기
          <ChevronRightIcon className="h-4.5 w-4.5 text-[#8B95A1]" />
        </Link>
      </div>
    </section>
  );
}
