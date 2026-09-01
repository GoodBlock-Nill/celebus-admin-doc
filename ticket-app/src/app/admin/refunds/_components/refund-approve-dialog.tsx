'use client';

import { useEffect, useState } from 'react';

import { Button, Field, NumberInput } from '../../_components/form';
import { hasRefundAccount } from './refund-columns';
import type { AdminRefundView } from '@/lib/admin-types';
import { formatKrw } from '@/lib/format';

/**
 * 환불 승인 확인 (재설계서 E-5).
 * 관람일 기준 단계표로 자동 계산한 수수료를 먼저 보여 주고, 필요하면 운영자가 조정한다.
 * 조정하지 않으면 자동 계산값 그대로 승인된다.
 */
export function RefundApproveDialog({
  row,
  onClose,
  onConfirm,
}: {
  row: AdminRefundView | null;
  onClose: () => void;
  /** 조정하지 않았으면 수수료를 비워 보내 서버 자동 계산을 그대로 쓴다 */
  onConfirm: (row: AdminRefundView, feeKrw: number | undefined) => void;
}) {
  const autoFee = row?.feeQuote?.feeKrw ?? 0;
  const [fee, setFee] = useState(autoFee);

  useEffect(() => {
    setFee(autoFee);
  }, [autoFee, row?.id]);

  if (!row) return null;

  const isValid = Number.isFinite(fee) && fee >= 0 && fee <= row.amountKrw;
  const net = isValid ? row.amountKrw - fee : 0;
  const isAdjusted = fee !== autoFee;

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-[rgba(27,29,34,0.45)] p-4">
      <div className="w-full max-w-[460px] rounded-xl border border-[#E3E5EA] bg-white p-5 shadow-[0_18px_48px_rgba(27,29,34,0.24)]">
        <h3 className="text-[16px] font-bold text-[#1B1D22]">환불을 승인할까요?</h3>

        <p className="mt-2.5 text-[13px] leading-relaxed text-[#4A4E5A]">
          {row.ticketCount > 0
            ? `주문 ${row.orderNo}의 티켓 ${row.ticketCount}매가 회수되고 환불 처리됩니다.`
            : `주문 ${row.orderNo}은 티켓 지급 전 주문입니다. 선점 좌석 ${row.qty}매가 반환되고 환불 처리됩니다.`}
        </p>

        {hasRefundAccount(row) ? (
          <p className="mt-2 text-[13px] font-semibold text-[#1B1D22]">
            환불 계좌 {row.refundBank} {row.refundAccountMasked} · 예금주 {row.refundHolder}
          </p>
        ) : null}

        <dl className="mt-4 rounded-lg border border-[#E3E5EA] bg-[#FAFBFC] px-3.5 py-3 text-[13px]">
          <div className="flex justify-between py-1">
            <dt className="text-[#6B7080]">결제 금액</dt>
            <dd className="font-semibold tabular-nums text-[#1B1D22]">{formatKrw(row.amountKrw)}</dd>
          </div>
          <div className="flex justify-between py-1">
            <dt className="text-[#6B7080]">자동 계산 수수료</dt>
            <dd className="font-semibold tabular-nums text-[#1B1D22]">
              {row.feeQuote ? formatKrw(row.feeQuote.feeKrw) : '-'}
            </dd>
          </div>
          <div className="flex justify-between border-t border-[#E3E5EA] pt-2 text-[#1B1D22]">
            <dt className="font-semibold">실환불액</dt>
            <dd className="text-[15px] font-bold tabular-nums">{formatKrw(net)}</dd>
          </div>
        </dl>

        {row.feeQuote ? (
          <p className="mt-2 text-[12px] leading-relaxed text-[#6B7080]">
            적용 기준 — {row.feeQuote.basis}
          </p>
        ) : null}

        <div className="mt-4">
          <Field
            label="환불 수수료 조정 (원)"
            hint={
              isAdjusted
                ? '자동 계산값과 다른 금액으로 승인합니다. 조정 사유는 고객센터 안내로 남겨 주세요.'
                : '값을 바꾸지 않으면 자동 계산 수수료가 그대로 적용됩니다.'
            }
            error={isValid ? undefined : `0원부터 ${formatKrw(row.amountKrw)}까지 입력해 주세요.`}
          >
            <NumberInput
              min={0}
              max={row.amountKrw}
              value={Number.isFinite(fee) ? fee : ''}
              onChange={(event) => setFee(Number.parseInt(event.target.value, 10))}
            />
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button
            variant="primary"
            disabled={!isValid}
            onClick={() => onConfirm(row, isAdjusted ? fee : undefined)}
          >
            환불 승인
          </Button>
        </div>
      </div>
    </div>
  );
}
