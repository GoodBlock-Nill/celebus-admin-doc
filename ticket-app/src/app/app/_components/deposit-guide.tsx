'use client';

import { useState } from 'react';

import { Countdown } from './countdown';
import { formatDeadlineLabel } from './datetime';
import { DepositAccountCard } from './deposit-account-card';
import { CopyIcon } from './icons';
import { useAppToast } from './toast';
import { CARD, MUTED, NUMERIC } from './ui';
import { useAppClock } from './use-app-clock';
import type { OrderDetailView } from '@/lib/api-types';
import { ORDER_NO_TAIL_LENGTH } from '@/lib/constants';

const DEPOSIT_NOTICES = [
  '입금이 확인되면 지급 대기로 바뀌고, 운영자의 티켓 지급 처리가 끝나면 내 티켓에서 확인할 수 있습니다.',
  '마감 시각까지 입금이 확인되지 않으면 예매가 자동 취소되고 좌석이 반환됩니다.',
  '금액이 다르게 입금된 경우 확인 보류로 전환되며, 전액 환불 후 다시 예매해 주세요.',
];

/** 입금 계좌·입금자명 규칙·마감 카운트다운을 함께 보여주는 안내 카드 */
export function DepositGuideCard({ order }: { order: OrderDetailView }) {
  const now = useAppClock();

  const realName = order.depositorName || '본인확인 실명';
  const depositorValue = `${realName}${order.orderNo.slice(-ORDER_NO_TAIL_LENGTH)}`;

  return (
    <div className="flex flex-col gap-3">
      <DepositAccountCard order={order} />

      <DepositorNameChip value={depositorValue} />

      {/* 마감이 임박한 정보라 경고 톤 배경으로 한 덩어리로 묶어 보여 준다. */}
      <section className="rounded-2xl bg-[#FFFAEB] p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[14px] font-semibold text-[#B54708]">입금 마감</span>
          <span className={`text-[13.5px] text-[#B54708] ${NUMERIC}`}>
            {formatDeadlineLabel(order.depositDeadline, now)}
          </span>
        </div>
        <p className="mt-2 text-center text-[22px] font-extrabold text-[#B54708]">
          <Countdown targetAt={order.depositDeadline} expiredLabel="입금 마감 지남" />
        </p>
      </section>

      {/* 자동 취소·확인 보류 조건은 놓치면 손해가 커서 본문에 가까운 크기·대비로 노출한다. */}
      <ul className="flex flex-col gap-2 px-1 text-[13.5px] leading-[1.65] text-[#4E5968]">
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

const CHIP_COPY_FEEDBACK_MS = 1500;

/** 입금자명을 규칙 해석 없이 그대로 붙여넣도록 단일 값으로 크게 노출하는 칩 카드 */
function DepositorNameChip({ value }: { value: string }) {
  const toast = useAppToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), CHIP_COPY_FEEDBACK_MS);
      toast.success('입금자명이 복사되었습니다');
    } catch {
      toast.info('복사할 수 없는 환경입니다. 화면에 표시된 값을 직접 입력해 주세요.');
    }
  };

  return (
    <section className={`${CARD} p-4`}>
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="h-[14px] w-[3px] rounded-full bg-[#D6336C]" />
        <p className="text-[14px] font-bold text-[#191F28]">입금자명 (필수)</p>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#F2F4F6] py-3 pl-4 pr-2">
        <p className={`truncate text-[22px] font-extrabold text-[#191F28] ${NUMERIC}`}>{value}</p>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-[10px] border border-[#E5E8EB] bg-white px-3 text-[13px] font-semibold text-[#191F28]"
        >
          <CopyIcon />
          {copied ? '복사했습니다' : '입금자명 복사'}
        </button>
      </div>

      <p className={`mt-2 text-[13px] ${MUTED}`}>실명 + 예매번호 끝 {ORDER_NO_TAIL_LENGTH}자리</p>
      <p className={`mt-0.5 text-[13px] ${MUTED}`}>다르면 확인이 보류돼요</p>
    </section>
  );
}
