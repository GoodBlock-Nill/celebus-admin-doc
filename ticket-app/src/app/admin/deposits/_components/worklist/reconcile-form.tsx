'use client';

import { useState } from 'react';

import { Button, Field, NumberInput, TextInput } from '../../../_components/form';
import { InfoNote } from '../../../_components/ui';
import type { AdminWorklistItemView } from '@/lib/admin-types';
import { formatKrw } from '@/lib/format';

const MAX_DEPOSITOR_NAME_LENGTH = 30;
/** 입금자명 보조 규칙에 쓰는 주문번호 뒷자리 수 */
const ORDER_NO_TAIL = 4;

/**
 * 은행 내역 대조 — 은행 입금 내역을 그대로 옮겨 적으면
 * 입금 등록 · 자동 대조 · 입금 확인까지 한 번에 처리한다.
 */
export function ReconcileForm({
  item,
  onSubmit,
  onClose,
}: {
  item: AdminWorklistItemView;
  onSubmit: (depositorName: string, amountKrw: number) => void;
  onClose: () => void;
}) {
  const order = item.order;
  const [depositorName, setDepositorName] = useState(
    order.holdActualDepositor ?? order.party.realName,
  );
  const [amount, setAmount] = useState(String(order.amountKrw));

  const amountKrw = Number(amount);
  const isReady = depositorName.trim() !== '' && Number.isInteger(amountKrw) && amountKrw > 0;

  return (
    <div className="flex flex-col gap-2.5">
      <InfoNote>
        은행 입금 내역의 입금자명·입금액을 그대로 입력하세요. 이 예매와 맞으면 입금 확인까지 한 번에
        처리되고, 어긋나면 등록만 된 뒤 확인 보류·주문 미상으로 분류됩니다. 예매 기준 —{' '}
        <b>
          {order.party.realName} 또는 {order.party.realName}
          {order.orderNo.slice(-ORDER_NO_TAIL)}
        </b>{' '}
        · <b>{formatKrw(order.amountKrw)}</b>
      </InfoNote>

      <div className="flex flex-wrap items-end gap-2">
        <Field label="입금자명" className="min-w-[200px] flex-1">
          <TextInput
            value={depositorName}
            onChange={(event) => setDepositorName(event.target.value)}
            maxLength={MAX_DEPOSITOR_NAME_LENGTH}
            placeholder="예) 홍길동"
          />
        </Field>
        <Field label="입금액 (원)" className="min-w-[160px]">
          <NumberInput min={1} value={amount} onChange={(event) => setAmount(event.target.value)} />
        </Field>
        <Button
          variant="primary"
          disabled={!isReady}
          onClick={() => onSubmit(depositorName.trim(), amountKrw)}
        >
          대조 후 입금 확인
        </Button>
        <Button onClick={onClose}>닫기</Button>
      </div>
    </div>
  );
}
