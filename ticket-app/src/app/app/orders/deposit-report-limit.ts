import type { OrderDetailView } from '@/lib/api-types';

/**
 * 입금 확인 요청 상한 — 서버 함수와 같은 기준(3회)이다.
 * 반려 ↔ 재요청을 되풀이하며 좌석을 붙잡는 것을 막기 위한 값이라, 요청 취소로는 줄지 않는다.
 */
export const MAX_DEPOSIT_REPORTS = 3;

/** 남은 요청 가능 횟수 */
export function remainingDepositReports(order: OrderDetailView): number {
  return Math.max(MAX_DEPOSIT_REPORTS - order.depositReportCount, 0);
}

/** 요청 횟수를 모두 쓴 예매인지 — 버튼을 잠그는 기준 */
export function isDepositReportExhausted(order: OrderDetailView): boolean {
  return remainingDepositReports(order) === 0;
}

/**
 * 남은 요청 횟수 안내 문구.
 * 마지막 한 번(세 번째 요청)을 앞둔 시점부터 보여 주고, 다 쓰면 고객센터 안내로 바꾼다.
 */
export function depositReportCaption(order: OrderDetailView): string | null {
  const remaining = remainingDepositReports(order);

  if (remaining === 0) {
    return '입금 확인 요청이 여러 차례 반려되었습니다. 고객센터로 문의해 주세요.';
  }
  if (remaining === 1) {
    return `입금 확인 요청은 ${MAX_DEPOSIT_REPORTS}회까지 할 수 있어요. 남은 횟수 ${remaining}회입니다.`;
  }
  return null;
}
