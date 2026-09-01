/**
 * 확인 보류 사유 해석 — 운영자가 남긴 사유 문구에서 어긋난 항목을 가려낸다.
 * 사유에 따라 회원이 해야 할 일이 달라지므로(이름 정정 / 환불 계좌 등록) 화면 구성의 기준이 된다.
 */

const NAME_KEYWORD = '입금자명';
const AMOUNT_KEYWORD = '금액';

export interface HoldCause {
  /** 입금자명이 예매 정보와 다른 경우 */
  isNameMismatch: boolean;
  /** 보낸 금액이 결제 금액과 다른 경우 */
  isAmountMismatch: boolean;
}

/**
 * 사유 문구를 해석한다.
 * 어느 쪽도 짚어내지 못한 사유(기타)는 두 갈래를 모두 안내해 회원이 막히지 않게 한다.
 */
export function holdCauseOf(holdReason: string | null): HoldCause {
  const reason = holdReason ?? '';
  const isNameMismatch = reason.includes(NAME_KEYWORD);
  const isAmountMismatch = reason.includes(AMOUNT_KEYWORD);

  if (!isNameMismatch && !isAmountMismatch) {
    return { isNameMismatch: true, isAmountMismatch: true };
  }
  return { isNameMismatch, isAmountMismatch };
}

/** "무엇이 다른가요" 목록에 세울 항목 이름 */
export function mismatchRows(holdReason: string | null): string[] {
  const reason = holdReason ?? '';
  const rows: string[] = [];
  if (reason.includes(NAME_KEYWORD)) rows.push(NAME_KEYWORD);
  if (reason.includes(AMOUNT_KEYWORD)) rows.push(AMOUNT_KEYWORD);
  return rows;
}
