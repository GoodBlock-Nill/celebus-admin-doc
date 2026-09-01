/**
 * 확인 보류 사유 해석 — 회원이 해야 할 일(이름 정정 / 환불 계좌 등록)을 가르는 기준.
 *
 * 판단 순서
 *   ① 표준 사유 구분이 있으면 그 값만 본다 (운영 문구가 바뀌어도 화면이 흔들리지 않는다)
 *   ② 값이 없는 지난 예매는 사유 문구의 낱말로 되짚는다 (이전 방식 유지)
 */

import type { HoldCauseCode } from '@/lib/api-types';

const NAME_LABEL = '입금자명';
const AMOUNT_LABEL = '금액';

export interface HoldMismatch {
  /** 입금자명이 예매 정보와 다른 경우 */
  isNameMismatch: boolean;
  /** 보낸 금액이 결제 금액과 다른 경우 */
  isAmountMismatch: boolean;
}

/** 표준 사유 구분별 어긋난 항목 */
const MISMATCH_BY_CAUSE: Record<HoldCauseCode, HoldMismatch> = {
  NAME: { isNameMismatch: true, isAmountMismatch: false },
  AMOUNT: { isNameMismatch: false, isAmountMismatch: true },
  BOTH: { isNameMismatch: true, isAmountMismatch: true },
  // 그 밖의 사유는 두 갈래를 모두 열어 회원이 막히지 않게 한다.
  OTHER: { isNameMismatch: true, isAmountMismatch: true },
};

function mismatchFromReason(holdReason: string | null): HoldMismatch {
  const reason = holdReason ?? '';
  const isNameMismatch = reason.includes(NAME_LABEL);
  const isAmountMismatch = reason.includes(AMOUNT_LABEL);

  if (!isNameMismatch && !isAmountMismatch) {
    return { isNameMismatch: true, isAmountMismatch: true };
  }
  return { isNameMismatch, isAmountMismatch };
}

/** 어느 항목이 어긋났는지 판단한다. */
export function holdMismatchOf(
  holdCause: HoldCauseCode | null,
  holdReason: string | null,
): HoldMismatch {
  if (holdCause) return MISMATCH_BY_CAUSE[holdCause];
  return mismatchFromReason(holdReason);
}

/**
 * "무엇이 다른가요" 목록에 세울 항목 이름.
 * 어긋난 항목을 특정할 수 없는 경우(그 밖의 사유)에는 빈 목록을 돌려주고,
 * 화면은 대신 운영자가 남긴 사유 문구를 그대로 보여 준다.
 */
export function mismatchRows(
  holdCause: HoldCauseCode | null,
  holdReason: string | null,
): string[] {
  if (holdCause === 'OTHER') return [];

  if (holdCause) {
    const mismatch = MISMATCH_BY_CAUSE[holdCause];
    return [
      ...(mismatch.isNameMismatch ? [NAME_LABEL] : []),
      ...(mismatch.isAmountMismatch ? [AMOUNT_LABEL] : []),
    ];
  }

  const reason = holdReason ?? '';
  return [
    ...(reason.includes(NAME_LABEL) ? [NAME_LABEL] : []),
    ...(reason.includes(AMOUNT_LABEL) ? [AMOUNT_LABEL] : []),
  ];
}
