'use client';

import { useState } from 'react';

import { Button, Select, TextInput } from '../../_components/form';
import { InfoNote } from '../../_components/ui';
import type { AdminDepositView, AdminOrderView } from '@/lib/admin-types';
import { formatKrw } from '@/lib/format';

const MAX_MEMO_LENGTH = 100;

function candidateLabel(order: AdminOrderView): string {
  return `${order.orderNo} · ${order.party.realName} · ${order.qty}매 · ${formatKrw(order.amountKrw)}`;
}

/** 처음 열었을 때 고를 예매 — 분할 입금 후보 → 동일 금액 후보 → 첫 번째 예매 순 */
function defaultOrderId(row: AdminDepositView, candidates: AdminOrderView[]): string {
  return (
    row.splitHint?.order.orderId ??
    row.matchCandidates[0]?.orderId ??
    candidates[0]?.id ??
    ''
  );
}

/**
 * 수동 매칭 — 이 입금을 어느 예매의 대금으로 볼지 고른다.
 * 나눠 들어온 입금은 함께 연결할 건을 골라 한 번에 잇는다(합계가 예매 금액과 같아야 한다).
 */
export function HeldMatchForm({
  row,
  candidates,
  siblings,
  onSubmit,
  onClose,
}: {
  row: AdminDepositView;
  candidates: AdminOrderView[];
  /** 같은 입금자명으로 나눠 들어온 다른 입금들 (분할 입금 후보) */
  siblings: AdminDepositView[];
  onSubmit: (depositIds: string[], orderId: string) => void;
  onClose: () => void;
}) {
  const [orderId, setOrderId] = useState(() => defaultOrderId(row, candidates));
  const [selectedIds, setSelectedIds] = useState<string[]>(
    () => row.splitHint?.depositIds ?? [row.id],
  );

  const selectedOrder = candidates.find((order) => order.id === orderId);
  const selectedTotal =
    row.amountKrw +
    siblings
      .filter((deposit) => selectedIds.includes(deposit.id))
      .reduce((sum, deposit) => sum + deposit.amountKrw, 0);
  const isSplit = selectedIds.length >= 2;
  const isSumMismatched = isSplit && Boolean(selectedOrder) && selectedTotal !== selectedOrder?.amountKrw;

  const toggle = (depositId: string) =>
    setSelectedIds((current) =>
      current.includes(depositId)
        ? current.filter((id) => id !== depositId)
        : [...current, depositId],
    );

  return (
    <div className="flex flex-col gap-2.5">
      {row.splitHint ? (
        <InfoNote tone="accent">
          분할 입금 후보 — 같은 입금자명의 미종결 입금 합계가 {formatKrw(row.splitHint.totalKrw)}으로 예매{' '}
          {row.splitHint.order.orderNo}의 금액과 일치합니다. 함께 연결하면 한 예매의 대금으로 처리됩니다.
        </InfoNote>
      ) : null}

      {row.matchCandidates.length >= 2 ? (
        <InfoNote tone="warning">
          같은 금액의 진행 중 예매가 {row.matchCandidates.length}건이라 자동 매칭하지 않았습니다. 은행 내역·입금자명을
          확인하고 어느 예매의 대금인지 직접 골라 주세요.
        </InfoNote>
      ) : null}

      {siblings.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-[#4A4E5A]">함께 연결할 입금</span>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-1.5 text-[13px] text-[#6B7080]">
              <input type="checkbox" checked readOnly />
              {row.depositorName} · {formatKrw(row.amountKrw)} (이 입금)
            </label>
            {siblings.map((deposit) => (
              <label key={deposit.id} className="flex items-center gap-1.5 text-[13px] text-[#1B1D22]">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(deposit.id)}
                  onChange={() => toggle(deposit.id)}
                />
                {deposit.depositorName} · {formatKrw(deposit.amountKrw)}
              </label>
            ))}
          </div>
          <span className="text-[12px] tabular-nums text-[#6B7080]">
            선택 합계 {formatKrw(selectedTotal)}
            {selectedOrder ? ` / 예매 금액 ${formatKrw(selectedOrder.amountKrw)}` : ''}
          </span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-[280px] flex-1 flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-[#4A4E5A]">연결할 주문 선택</span>
          <Select value={orderId} onChange={(event) => setOrderId(event.target.value)}>
            {candidates.length === 0 ? <option value="">연결 가능한 주문이 없습니다</option> : null}
            {candidates.map((order) => (
              <option key={order.id} value={order.id}>
                {candidateLabel(order)}
              </option>
            ))}
          </Select>
        </div>
        <Button
          variant="primary"
          disabled={!orderId || isSumMismatched}
          title={isSumMismatched ? '선택한 입금의 합계가 예매 금액과 다릅니다.' : undefined}
          onClick={() => onSubmit([row.id, ...selectedIds.filter((id) => id !== row.id)], orderId)}
        >
          {isSplit ? `입금 ${selectedIds.length}건 연결` : '주문에 연결'}
        </Button>
        <Button onClick={onClose}>닫기</Button>
      </div>
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
