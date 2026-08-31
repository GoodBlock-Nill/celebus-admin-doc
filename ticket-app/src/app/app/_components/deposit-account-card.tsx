'use client';

import { useState } from 'react';

import { CopyIcon } from './icons';
import { InfoRow } from './section';
import { useAppToast } from './toast';
import { buildTossSendUrl, useTossTransfer } from './toss-transfer';
import { CARD, MUTED, NUMERIC, PRIMARY_BUTTON } from './ui';
import type { OrderDetailView } from '@/lib/api-types';
import { formatKrw } from '@/lib/format';

const COPY_FEEDBACK_MS = 1500;

const TOSS_UNAVAILABLE_MESSAGE =
  '토스 앱이 없거나 데스크톱 환경입니다. 계좌번호를 복사해 이용 중인 은행 앱에서 입금해 주세요.';
const COPY_UNAVAILABLE_MESSAGE = '복사할 수 없는 환경입니다. 화면에 표시된 값을 직접 입력해 주세요.';

type CopiedTarget = 'NONE' | 'ACCOUNT' | 'AMOUNT';

/** 입금 계좌·금액과 송금 실행 버튼을 함께 담는 카드 */
export function DepositAccountCard({ order }: { order: OrderDetailView }) {
  const toast = useAppToast();
  const [copied, setCopied] = useState<CopiedTarget>('NONE');
  const openToss = useTossTransfer(() => toast.info(TOSS_UNAVAILABLE_MESSAGE));

  const handleCopy = async (target: CopiedTarget, value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(target);
      window.setTimeout(() => setCopied('NONE'), COPY_FEEDBACK_MS);
      toast.success(message);
    } catch {
      toast.info(COPY_UNAVAILABLE_MESSAGE);
    }
  };

  return (
    <section className={`${CARD} p-4`}>
      <p className={`text-[13px] ${MUTED}`}>입금 계좌</p>
      <p className="mt-1 text-[16px] font-bold text-[#191F28]">
        {order.bank.name} <span className={NUMERIC}>{order.bank.account}</span>
      </p>
      <p className={`mt-0.5 text-[13px] ${MUTED}`}>예금주 {order.bank.holder}</p>

      <div className="mt-3 border-t border-[#E5E8EB] pt-2">
        <div className="flex items-center justify-between gap-3 py-1.5">
          <span className={`text-[14px] ${MUTED}`}>입금 금액</span>
          <span className={`text-[22px] font-extrabold text-[#191F28] ${NUMERIC}`}>
            {formatKrw(order.amountKrw)}
          </span>
        </div>
        <InfoRow label="주문번호" value={order.orderNo} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <CopyButton
          label="계좌번호 복사"
          copied={copied === 'ACCOUNT'}
          onClick={() =>
            void handleCopy('ACCOUNT', order.bank.account, '계좌번호가 복사되었습니다')
          }
        />
        <CopyButton
          label="금액 복사"
          copied={copied === 'AMOUNT'}
          onClick={() =>
            void handleCopy('AMOUNT', String(order.amountKrw), '금액이 복사되었습니다')
          }
        />
      </div>

      <button
        type="button"
        onClick={() => openToss(buildTossSendUrl(order.bank.name, order.bank.account, order.amountKrw))}
        className={`${PRIMARY_BUTTON} mt-2`}
      >
        토스로 송금하기
      </button>
      <p className={`mt-1.5 text-center text-[12.5px] ${MUTED}`}>
        토스 앱이 설치된 휴대폰에서 동작합니다
      </p>
    </section>
  );
}

interface CopyButtonProps {
  label: string;
  copied: boolean;
  onClick: () => void;
}

/** 계좌번호·금액 복사 버튼 — 두 버튼이 같은 형태를 쓴다. */
function CopyButton({ label, copied, onClick }: CopyButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-[#E5E8EB] bg-white text-[13.5px] font-semibold text-[#191F28]"
    >
      <CopyIcon />
      {copied ? '복사했습니다' : label}
    </button>
  );
}
