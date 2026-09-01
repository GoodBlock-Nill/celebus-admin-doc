import { NoticeBox } from '../_components/section';
import type { OrderDetailView } from '@/lib/api-types';
import { formatDateTime } from '@/lib/format';

const HOLD_DEFAULT_REASON = '입금자명이 일치하지 않아 확인 중입니다. 운영자 확인 후 안내해 드리겠습니다.';

/**
 * 예매 상세의 상태별 안내 박스.
 * 티켓 확인처는 CELEBUS 본앱이므로 지급 관련 안내는 모두 본앱을 가리킨다.
 */
export function OrderStatusNotice({ order }: { order: OrderDetailView }) {
  if (order.status === 'ON_HOLD') {
    return <NoticeBox tone="warning">{order.holdReason ?? HOLD_DEFAULT_REASON}</NoticeBox>;
  }

  if (order.status === 'DEPOSIT_CONFIRMED') {
    return (
      <NoticeBox tone="accent">
        입금 확인 완료 — 예매가 확정되었습니다. 티켓은 공연 당일 CELEBUS 앱으로 지급되며, 지급되면
        CELEBUS 앱에서 확인할 수 있습니다.
      </NoticeBox>
    );
  }

  if (order.status === 'CANCEL_REQUESTED') {
    return (
      <NoticeBox tone="accent">
        취소 요청이 접수되었습니다. 요청 후 24시간 이내에 환불이 처리됩니다.
      </NoticeBox>
    );
  }

  if (order.status === 'REFUNDED') {
    return (
      <NoticeBox tone="muted">
        환불이 완료되었습니다. 발급되었던 티켓은 회수 처리되었습니다.
        {order.refundedAt ? ` (${formatDateTime(order.refundedAt)})` : ''}
      </NoticeBox>
    );
  }

  return null;
}
