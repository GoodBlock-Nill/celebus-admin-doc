'use client';

import { Countdown } from './countdown';
import { formatDeadlineLabel } from './datetime';
import { DepositAccountCard } from './deposit-account-card';
import { NoticeBox } from './section';
import { CARD, MUTED, NUMERIC } from './ui';
import { useAppClock } from './use-app-clock';
import type { OrderDetailView } from '@/lib/api-types';
import { ORDER_NO_TAIL_LENGTH } from '@/lib/constants';

const DEPOSIT_NOTICES = [
  '입금이 확인되면 지급 대기로 바뀌고, 운영자의 티켓 지급 처리가 끝나면 내 티켓에서 확인할 수 있습니다.',
  '마감 시각까지 입금이 확인되지 않으면 주문은 자동 취소되고 좌석이 반환됩니다.',
  '금액이 다르게 입금된 경우 확인 보류로 전환되며, 전액 환불 후 다시 주문해 주세요.',
];

/** 입금 계좌·입금자명 규칙·마감 카운트다운을 함께 보여주는 안내 카드 */
export function DepositGuideCard({ order }: { order: OrderDetailView }) {
  const now = useAppClock();

  const realName = order.depositorName || '본인확인 실명';
  const fallbackName = `${realName}${order.orderNo.slice(-ORDER_NO_TAIL_LENGTH)}`;

  return (
    <div className="flex flex-col gap-3">
      <DepositAccountCard order={order} />

      <NoticeBox tone="accent">
        <span className="font-bold">
          반드시 &lsquo;{realName}&rsquo; 이름으로 입금해 주세요.
        </span>
        <br />
        부득이하게 다른 이름으로 입금해야 한다면 &lsquo;{fallbackName}&rsquo;(실명 + 주문번호 끝 4자리)로
        입금해 주세요.
      </NoticeBox>

      <section className={`${CARD} p-4`}>
        <div className="flex items-center justify-between gap-3">
          <span className={`text-[13px] ${MUTED}`}>입금 마감</span>
          <span className={`text-[13px] font-semibold ${NUMERIC}`}>
            {formatDeadlineLabel(order.depositDeadline, now)}
          </span>
        </div>
        <p className="mt-2 text-center text-[22px] font-extrabold text-[#F5B341]">
          <Countdown targetAt={order.depositDeadline} expiredLabel="입금 마감 지남" />
        </p>
      </section>

      {/* 자동 취소·확인 보류 조건은 놓치면 손해가 커서 본문에 가까운 크기·대비로 노출한다. */}
      <ul className="flex flex-col gap-2 px-1 text-[13px] leading-relaxed text-[#C9C8CE]">
        {DEPOSIT_NOTICES.map((notice) => (
          <li key={notice} className="flex gap-1.5">
            <span aria-hidden="true">·</span>
            <span>{notice}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
