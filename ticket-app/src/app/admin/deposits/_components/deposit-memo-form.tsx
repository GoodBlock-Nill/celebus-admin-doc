'use client';

import { Button, TextInput } from '../../_components/form';

const MAX_MEMO_LENGTH = 100;

/** 보류·반환 사유를 적는 한 줄 폼 — 사유는 회원 안내와 활동 이력에 그대로 남는다 */
export function DepositMemoForm({
  kind,
  memo,
  onChange,
  onSubmit,
  onClose,
}: {
  kind: 'hold' | 'refund';
  memo: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const isHold = kind === 'hold';

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex min-w-[260px] flex-1 flex-col gap-1.5">
        <span className="text-[12px] font-semibold text-[#4A4E5A]">
          {isHold ? '보류 사유' : '반환 사유'}
        </span>
        <TextInput
          value={memo}
          onChange={(event) => onChange(event.target.value)}
          maxLength={MAX_MEMO_LENGTH}
        />
      </div>
      <Button variant={isHold ? 'primary' : 'danger'} onClick={onSubmit}>
        {isHold ? '보류로 돌리기' : '반환 대상으로 지정'}
      </Button>
      <Button onClick={onClose}>닫기</Button>
    </div>
  );
}
