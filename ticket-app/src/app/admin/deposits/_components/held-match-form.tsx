'use client';

import { Button, Select, TextInput } from '../../_components/form';
import type { AdminOrderView } from '@/lib/admin-types';
import { formatKrw } from '@/lib/format';

const MAX_MEMO_LENGTH = 100;

function candidateLabel(order: AdminOrderView): string {
  return `${order.orderNo} · ${order.party.realName} · ${order.qty}매 · ${formatKrw(order.amountKrw)}`;
}

/** 수동 매칭 — 이 입금을 어느 예매의 대금으로 볼지 고른다 */
export function HeldMatchForm({
  candidates,
  selectedOrderId,
  onSelect,
  onSubmit,
  onClose,
}: {
  candidates: AdminOrderView[];
  selectedOrderId: string;
  onSelect: (orderId: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex min-w-[280px] flex-1 flex-col gap-1.5">
        <span className="text-[12px] font-semibold text-[#4A4E5A]">연결할 주문 선택</span>
        <Select value={selectedOrderId} onChange={(event) => onSelect(event.target.value)}>
          {candidates.length === 0 ? <option value="">연결 가능한 주문이 없습니다</option> : null}
          {candidates.map((order) => (
            <option key={order.id} value={order.id}>
              {candidateLabel(order)}
            </option>
          ))}
        </Select>
      </div>
      <Button variant="primary" disabled={!selectedOrderId} onClick={onSubmit}>
        주문에 연결
      </Button>
      <Button onClick={onClose}>닫기</Button>
    </div>
  );
}

/** 반환 대상 지정 — 예매 대금으로 인정하지 않고 돌려줄 돈으로 분류한다 */
export function HeldRefundForm({
  memo,
  onChange,
  onSubmit,
  onClose,
}: {
  memo: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex min-w-[280px] flex-1 flex-col gap-1.5">
        <span className="text-[12px] font-semibold text-[#4A4E5A]">반환 사유</span>
        <TextInput
          value={memo}
          onChange={(event) => onChange(event.target.value)}
          maxLength={MAX_MEMO_LENGTH}
        />
      </div>
      <Button variant="danger" onClick={onSubmit}>
        반환 대상으로 지정
      </Button>
      <Button onClick={onClose}>닫기</Button>
    </div>
  );
}
