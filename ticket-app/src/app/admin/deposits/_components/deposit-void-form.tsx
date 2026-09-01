'use client';

import { Button, TextInput } from '../../_components/form';

/** 등록 취소 사유 기본값 — 대부분 은행 내역을 잘못 옮겨 적은 경우다 */
export const DEFAULT_VOID_REASON = '입금 오등록 — 은행 내역과 다름';

const MAX_REASON_LENGTH = 100;

/**
 * 입금 등록 취소 사유 입력 줄.
 * 등록 취소는 수납 기록을 무효로 돌리는 처리라 사유를 반드시 남기고 확인을 한 번 더 받는다.
 */
export function DepositVoidForm({
  reason,
  onChange,
  onSubmit,
  onClose,
}: {
  reason: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex min-w-[280px] flex-1 flex-col gap-1.5">
        <span className="text-[12px] font-semibold text-[#4A4E5A]">등록 취소 사유</span>
        <TextInput
          value={reason}
          onChange={(event) => onChange(event.target.value)}
          maxLength={MAX_REASON_LENGTH}
        />
      </div>
      <Button variant="danger" disabled={reason.trim() === ''} onClick={onSubmit}>
        등록 취소
      </Button>
      <Button onClick={onClose}>닫기</Button>
    </div>
  );
}
