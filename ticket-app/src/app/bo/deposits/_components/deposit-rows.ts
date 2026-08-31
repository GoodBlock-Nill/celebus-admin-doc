import type { DemoUser, DepositRecord, IdentityVerification, Order } from '@/lib/types';

export interface DepositRow {
  deposit: DepositRecord;
  order?: Order;
  realName?: string;
  nickname?: string;
}

/** 입금 건에 매칭 주문·주문자 정보를 붙여 표 행으로 만든다. (최근 입금이 위) */
export function buildDepositRows(
  deposits: DepositRecord[],
  orders: Order[],
  verifications: IdentityVerification[],
  users: DemoUser[],
): DepositRow[] {
  return deposits
    .slice()
    .sort((a, b) => new Date(b.depositedAt).getTime() - new Date(a.depositedAt).getTime())
    .map((deposit) => {
      const order = orders.find((item) => item.id === deposit.matchedOrderId);
      const verification = order
        ? verifications.find((item) => item.userId === order.userId)
        : undefined;
      const user = order ? users.find((item) => item.id === order.userId) : undefined;
      return { deposit, order, realName: verification?.realName, nickname: user?.nickname };
    });
}

/** 수동 매칭 후보 — 입금대기·보류 상태의 주문 */
export function matchableOrders(orders: Order[]): Order[] {
  return orders
    .filter((order) => order.status === 'AWAITING_DEPOSIT' || order.status === 'ON_HOLD')
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

/** 가장 먼저 접수된 입금대기 주문 (시나리오 프리셋 대상) */
export function firstAwaitingOrder(orders: Order[]): Order | undefined {
  return orders
    .filter((order) => order.status === 'AWAITING_DEPOSIT')
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
}
