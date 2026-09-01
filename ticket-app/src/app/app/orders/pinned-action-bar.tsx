'use client';

import { useState } from 'react';

import { formatCountdownCoarse } from '../_components/datetime';
import { useAppToast } from '../_components/toast';
import { buildTossSendUrl, useTossTransfer } from '../_components/toss-transfer';
import { NUMERIC } from '../_components/ui';
import { useAppClock } from '../_components/use-app-clock';
import { depositReportCaption, isDepositReportExhausted } from './deposit-report-limit';
import { api } from '@/lib/api-client';
import type { OrderDetailView } from '@/lib/api-types';

const TOSS_UNAVAILABLE_MESSAGE = '토스 앱이 설치된 휴대폰에서 이용할 수 있습니다.';

interface PinnedActionBarProps {
  order: OrderDetailView;
  /** 요청 성공 후 예매 상세를 다시 불러온다 */
  onDone: () => void;
  /** 실패 사유를 상세 화면 상단 안내에 전달한다 */
  onFail: (reason: string) => void;
}

/**
 * 입금 대기 전용 하단 고정 액션바 — 스크롤 위치와 무관하게
 * 마감 잔여 시간과 핵심 행동 2개(토스 송금·입금확인 요청)를 상시 노출한다.
 */
export function PinnedActionBar({ order, onDone, onFail }: PinnedActionBarProps) {
  const now = useAppClock();
  const toast = useAppToast();
  const openToss = useTossTransfer(() => toast.info(TOSS_UNAVAILABLE_MESSAGE));
  const [isSubmitting, setSubmitting] = useState(false);

  const remainMs = new Date(order.depositDeadline).getTime() - now.getTime();
  const remainLabel = formatCountdownCoarse(remainMs);
  // 입금 확인 요청 횟수를 다 쓰면 버튼을 잠그고 남은 횟수·고객센터 안내를 바 위에 올린다.
  const isExhausted = isDepositReportExhausted(order);
  const caption = depositReportCaption(order);

  const handleReport = async () => {
    if (isSubmitting) return;

    setSubmitting(true);
    const result = await api.reportDeposit(order.id);
    setSubmitting(false);

    onFail(result.ok ? '' : result.reason);
    if (result.ok) onDone();
  };

  return (
    <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[420px] -translate-x-1/2 border-t border-[#E5E8EB] bg-white px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
      {caption ? (
        <p className="mb-2 text-[12.5px] leading-relaxed text-[#6B7684]">{caption}</p>
      ) : null}
      <div className="flex items-center gap-2.5">
        <p className={`min-w-0 shrink text-[12.5px] leading-tight text-[#6B7684] ${NUMERIC}`}>
          {remainLabel ? (
            <>
              입금 마감
              <br />
              {remainLabel} 남음
            </>
          ) : (
            '입금 마감 지남'
          )}
        </p>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() =>
              openToss(buildTossSendUrl(order.bank.name, order.bank.account, order.amountKrw))
            }
            className="flex min-h-[48px] items-center justify-center rounded-xl border border-[#D6336C] bg-white px-4 text-[15px] font-bold text-[#D6336C]"
          >
            토스로 송금
          </button>
          <button
            type="button"
            disabled={isSubmitting || isExhausted}
            onClick={() => void handleReport()}
            className="flex min-h-[48px] items-center justify-center rounded-xl bg-[#D6336C] px-4 text-[15px] font-bold text-white disabled:bg-[#E5E8EB] disabled:text-[#B0B8C1]"
          >
            입금확인 요청
          </button>
        </div>
      </div>
    </div>
  );
}
