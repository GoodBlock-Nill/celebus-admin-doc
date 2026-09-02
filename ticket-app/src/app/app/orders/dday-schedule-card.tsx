'use client';

import { CheckIcon } from '../_components/icons';
import { TicketPerforation } from '../_components/perforation';
import { CARD, NUMERIC } from '../_components/ui';
import { useAppClock } from '../_components/use-app-clock';
import type { OrderDetailView } from '@/lib/api-types';
import { formatDateTimeWithWeekday } from '@/lib/format';
import { kstDayDiff } from '@/lib/time';

const DAY_OF_CHECKLIST = [
  '공연 당일 CELEBUS 앱 열기',
  'MY TICKET에서 QR 확인',
  '입장 전 밝기 최대로',
] as const;

/**
 * 입금 확인(예매 확정) 전용 — 공연일까지의 시간축을 D-Day 카드 한 장으로 압축해
 * 다음 일정(공연 당일 CELEBUS 앱 발권)에 대한 기대와 준비를 명확히 한다.
 */
export function DdayScheduleCard({ order }: { order: OrderDetailView }) {
  const now = useAppClock();
  const diff = order.sessionStartAt ? kstDayDiff(order.sessionStartAt, now) : null;

  // 공연일이 지났거나 계산 불가하면 일정 카드를 띄울 이유가 없다.
  if (diff === null || diff < 0) return null;

  return (
    <section className={`${CARD} p-4`}>
      <p className="text-[15px] font-bold text-[#191F28]">다음 일정</p>
      <span
        className={`mt-2.5 inline-flex items-center rounded-full bg-[#D6336C] px-6 py-2 text-[28px] font-bold leading-none text-white ${NUMERIC}`}
      >
        {diff === 0 ? 'D-DAY' : `D-${diff}`}
      </span>
      <p className={`mt-3 text-[15px] text-[#4E5968] ${NUMERIC}`}>
        <span className="text-[#8B95A1]">공연일</span>{' '}
        <span className="font-semibold text-[#191F28]">
          {order.sessionStartAt ? formatDateTimeWithWeekday(order.sessionStartAt) : '-'}
        </span>
      </p>

      <TicketPerforation className="my-3" />

      <ul className="flex flex-col gap-2.5">
        {DAY_OF_CHECKLIST.map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-[15px] text-[#191F28]">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#D6336C]">
              <CheckIcon className="h-3.5 w-3.5 text-[#D6336C]" />
            </span>
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[13px] text-[#8B95A1]">티켓은 공연 당일에만 앱에서 확인 가능</p>
    </section>
  );
}
