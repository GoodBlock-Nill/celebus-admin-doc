'use client';

import Link from 'next/link';
import { useState } from 'react';

import { ChevronRightIcon, ReceiptIcon } from '../_components/icons';
import { InfoRow } from '../_components/section';
import { CARD } from '../_components/ui';
import { OrderTimeline } from './order-timeline';
import type { OrderDetailView } from '@/lib/api-types';
import { CS_EMAIL } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';

/**
 * 만료된 예매 아카이브 카드 — 실패 프로세스를 앞세우지 않고
 * 예매 기록을 "지난 예매"로 보관하듯 요약한다. 진행 내역은 원할 때만 펼친다.
 */
export function ExpiredArchiveCard({ order }: { order: OrderDetailView }) {
  const [showsHistory, setShowsHistory] = useState(false);

  return (
    <section className={`${CARD} p-4`}>
      <h2 className="text-[18px] font-bold text-[#191F28]">만료된 예매</h2>
      <div className="mt-1">
        <InfoRow label="공연" value={order.concertTitle} />
        <InfoRow label="회차" value={order.sessionName} />
        <InfoRow label="매수" value={`${order.qty}매`} />
        <InfoRow label="신청일시" value={formatDateTime(order.createdAt)} />
      </div>
      <button
        type="button"
        onClick={() => setShowsHistory((value) => !value)}
        aria-expanded={showsHistory}
        className="mt-3.5 flex min-h-[52px] w-full items-center gap-2.5 rounded-xl border border-[#E5E8EB] px-4 text-left text-[15px] font-semibold text-[#191F28]"
      >
        <ReceiptIcon className="h-5 w-5 shrink-0 text-[#6B7684]" />
        진행 내역 보기
        <ChevronRightIcon
          className={`ml-auto h-5 w-5 shrink-0 text-[#B0B8C1] transition-transform ${
            showsHistory ? 'rotate-90' : ''
          }`}
        />
      </button>
      {showsHistory ? (
        <div className="mt-3.5 border-t border-[#F2F4F6] pt-3.5">
          <OrderTimeline order={order} />
        </div>
      ) : null}
    </section>
  );
}

/** 만료 화면의 다음 행동 — 재예매를 앞세우고 구제 문의를 나란히 둔다 */
export function ExpiredActions({ order }: { order: OrderDetailView }) {
  return (
    <div className="flex gap-2.5">
      <Link
        href={`/app/concert/${order.concertId}`}
        className="flex min-h-[52px] flex-1 items-center justify-center rounded-xl border border-[#D6336C] bg-white px-3 text-[15px] font-bold text-[#D6336C]"
      >
        다시 예매하기
      </Link>
      <a
        href={`mailto:${CS_EMAIL}`}
        className="flex min-h-[52px] flex-1 items-center justify-center rounded-xl bg-[#D6336C] px-3 text-[15px] font-bold text-white"
      >
        고객센터 문의
      </a>
    </div>
  );
}
