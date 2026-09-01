'use client';

/**
 * 할 일 큐의 처리 손잡이 모음.
 * 화면 어디에서 눌러도 같은 서버 함수를 같은 순서로 호출하도록 처리 로직을 한곳에 모은다.
 */
import { HOLD_CAUSE_VIEW } from '../../../_components/labels';
import { useToast } from '../../../_components/toast';
import { adminApi } from '@/lib/admin-client';
import type { AdminOrderView, AdminWorklistItemView, ReconcileInput } from '@/lib/admin-types';
import type { ApiResult } from '@/lib/api-client';
import { formatKrw } from '@/lib/format';

export interface WorklistActions {
  reconcile: (item: AdminWorklistItemView, depositorName: string, amountKrw: number) => Promise<void>;
  confirmDeposit: (item: AdminWorklistItemView, depositId: string) => Promise<void>;
  holdDeposit: (depositId: string, memo: string) => Promise<void>;
  markRefundTarget: (depositId: string, memo: string) => Promise<void>;
  manualMatch: (depositIds: string[], orderId: string) => Promise<void>;
  rejectReport: (order: AdminOrderView) => Promise<void>;
  rejectHold: (order: AdminOrderView) => Promise<void>;
  issueTickets: (order: AdminOrderView) => Promise<void>;
  undoConfirm: (order: AdminOrderView) => Promise<void>;
}

export function useWorklistActions(onDone: () => void): WorklistActions {
  const toast = useToast();

  /** 처리 결과를 알림으로 바꾸고, 성공했으면 목록을 다시 읽는다 */
  const run = async <T>(request: Promise<ApiResult<T>>, message: string): Promise<void> => {
    const result = await request;
    toast.fromResult(result, message);
    if (result.ok) onDone();
  };

  const reconcile = async (
    item: AdminWorklistItemView,
    depositorName: string,
    amountKrw: number,
  ): Promise<void> => {
    const input: ReconcileInput = { orderId: item.order.id, depositorName, amountKrw };
    const result = await adminApi.reconcileDeposit(input);

    if (!result.ok) {
      toast.error(result.reason);
      return;
    }

    const data = result.data;
    const registered = `${depositorName} · ${formatKrw(amountKrw)} 입금 등록`;

    if (data.outcome === 'CONFIRMED') {
      toast.success(
        `주문 ${item.order.orderNo} 입금 확인 완료 — 등록·대조·입금 확인을 한 번에 처리했습니다.`,
      );
    } else if (data.outcome === 'CONFIRM_FAILED') {
      toast.error(`${registered}은 되었으나 입금 확인에 실패했습니다. ${data.reason ?? ''}`);
    } else if (data.outcome === 'MATCHED_OTHER' || data.outcome === 'LINKED_OTHER') {
      toast.info(
        `${registered} — 이 예매가 아니라 주문 ${data.matchedOrderNo ?? ''}에 연결되었습니다. 해당 주문에서 이어서 처리해 주세요.`,
      );
    } else if (data.outcome === 'HELD') {
      const cause = data.holdCause ? HOLD_CAUSE_VIEW[data.holdCause].label : '확인 필요';
      toast.info(`${registered} — 예매와 어긋나 확인 보류로 전환했습니다. (${cause})`);
    } else if (data.outcome === 'REFUND_TARGET') {
      toast.info(`${registered} — 마감·취소 이후 입금이라 반환 대상으로 분류했습니다.`);
    } else {
      toast.info(`${registered} — 대조 가능한 예매가 없어 주문 미상 입금으로 분류했습니다.`);
    }

    onDone();
  };

  return {
    reconcile,
    confirmDeposit: (item, depositId) =>
      run(
        adminApi.confirmDeposit(depositId),
        `주문 ${item.order.orderNo} 입금 확인 — 티켓 지급 대기로 전환되었습니다.`,
      ),
    holdDeposit: (depositId, memo) =>
      run(adminApi.holdDeposit(depositId, memo), '입금을 확인 보류로 돌렸습니다.'),
    markRefundTarget: (depositId, memo) =>
      run(adminApi.markRefundTarget(depositId, memo), '입금을 반환 대상으로 지정했습니다.'),
    manualMatch: (depositIds, orderId) =>
      run(
        adminApi.manualMatch(depositIds, orderId),
        depositIds.length > 1
          ? `분할 입금 ${depositIds.length}건을 선택한 주문에 연결했습니다.`
          : '입금을 선택한 주문에 연결했습니다.',
      ),
    rejectReport: (order) =>
      run(
        adminApi.rejectDepositReport(order.id),
        `주문 ${order.orderNo} 미입금 반려 — 입금 대기로 되돌렸습니다.`,
      ),
    rejectHold: (order) =>
      run(
        adminApi.rejectHold(order.id),
        `주문 ${order.orderNo} 보류 반려 — 입금 대기로 되돌리고 입금은 반환 대상으로 넘겼습니다.`,
      ),
    issueTickets: (order) =>
      run(adminApi.issueOrderTickets(order.id), `주문 ${order.orderNo} 티켓 ${order.qty}매를 지급했습니다.`),
    undoConfirm: (order) =>
      run(
        adminApi.undoConfirmDeposit(order.id),
        `주문 ${order.orderNo} 입금 확인을 취소하고 입금 대기로 되돌렸습니다.`,
      ),
  };
}
