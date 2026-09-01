import type { AdminWorklistItemView } from '@/lib/admin-types';

/** 큐에서 바로 실행할 수 있는 권장 처리 구분 */
export type RecommendedKey = 'reconcile' | 'confirm' | 'reject-hold' | 'issue' | 'match';

export interface Recommendation {
  key: RecommendedKey;
  label: string;
  /** 왜 이 처리를 권하는지 — 행 확장에 함께 보여 준다 */
  reason: string;
}

/** 확인 보류에서 인정 처리 대상이 되는 입금 (대금으로 인정할 수 있는 상태) */
function holdDepositOf(item: AdminWorklistItemView) {
  return item.deposits.find(
    (deposit) => deposit.status === 'HELD' || deposit.status === 'AUTO_MATCHED',
  );
}

/** 확인 보류 — 회원이 알린 정보와 보류 사유로 권장 처리를 가른다 */
function holdRecommendation(item: AdminWorklistItemView): Recommendation {
  const order = item.order;
  const deposit = holdDepositOf(item);

  if (!deposit) {
    return {
      key: 'match',
      label: '수동 매칭',
      reason: '이 예매에 이어진 입금이 없습니다. 은행 내역에서 해당 입금을 찾아 연결해 주세요.',
    };
  }

  if (order.holdActualDepositor) {
    return {
      key: 'confirm',
      label: '입금 확인 (인정)',
      reason: `회원이 실제 입금자명 '${order.holdActualDepositor}'을(를) 알려 왔습니다. 은행 내역이 확인되면 대금으로 인정하세요.`,
    };
  }

  if (order.refundBank && order.refundAccountMasked) {
    return {
      key: 'reject-hold',
      label: '보류 반려',
      reason:
        '회원이 환불 계좌를 등록했습니다. 대금으로 인정하지 않고 반려하면 받은 입금은 반환 대상이 되고 예매는 입금 대기로 돌아갑니다.',
    };
  }

  if (order.holdCause === 'AMOUNT' || order.holdCause === 'BOTH') {
    return {
      key: 'reject-hold',
      label: '보류 반려',
      reason:
        '입금액이 예매 금액과 달라 대금으로 인정하기 어렵습니다. 회원 안내 후 반려하면 받은 입금은 반환 대상이 됩니다.',
    };
  }

  return {
    key: 'confirm',
    label: '입금 확인 (인정)',
    reason: '입금자명만 어긋난 건입니다. 은행 내역·회원 확인이 끝났다면 대금으로 인정하세요.',
  };
}

/** 이 예매에 지금 권하는 처리 1가지 */
export function recommendationOf(item: AdminWorklistItemView): Recommendation {
  if (item.kind === 'REPORTED') {
    return {
      key: 'reconcile',
      label: '은행 내역 대조',
      reason:
        '회원이 입금을 알렸습니다. 은행 내역의 입금자명·금액을 옮겨 적으면 입금 확인까지 한 번에 끝납니다.',
    };
  }

  if (item.kind === 'AWAITING_CONFIRM') {
    return {
      key: 'confirm',
      label: '입금 확인',
      reason: '입금자명·금액이 예매와 맞아 자동으로 이어졌습니다. 은행 내역 확인 후 입금 확인을 누르세요.',
    };
  }

  if (item.kind === 'ON_HOLD') return holdRecommendation(item);

  return {
    key: 'issue',
    label: '티켓 지급',
    reason: '입금이 확인된 예매입니다. 지급 처리를 해야 실명 티켓이 발급됩니다.',
  };
}

/** 권장 처리 대상 입금 — 입금 확인·인정에 사용할 1건 */
export function targetDepositId(item: AdminWorklistItemView): string | null {
  if (item.kind === 'AWAITING_CONFIRM') {
    return item.deposits.find((deposit) => deposit.status === 'AUTO_MATCHED')?.id ?? null;
  }
  return holdDepositOf(item)?.id ?? null;
}
