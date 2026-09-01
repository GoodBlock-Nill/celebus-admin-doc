import { NoticeBox } from '../_components/section';
import type { OrderDetailView } from '@/lib/api-types';
import { formatDateTime } from '@/lib/format';

const HOLD_DEFAULT_REASON = '입금자명이 일치하지 않아 확인 중입니다. 운영자 확인 후 안내해 드리겠습니다.';

/**
 * 입금 대기로 되돌아온 사유 — 미입금 반려와 보류 반려는 회원이 할 일이 다르다.
 *  · 미입금 반려 = 입금이 확인되지 않음 → 입금 후 다시 요청
 *  · 보류 반려   = 보낸 돈을 예매와 대조하지 못함 → 환불 후 정확한 금액·입금자명으로 재송금
 * 두 이력이 함께 있으면 더 최근 처리를 안내한다.
 */
function latestRejection(order: OrderDetailView): { isHold: boolean; at: string } | null {
  const holdAt = order.holdRejectedAt;
  const reportAt = order.reportRejectedAt;

  if (holdAt && reportAt) {
    const isHoldLater = Date.parse(holdAt) >= Date.parse(reportAt);
    return isHoldLater ? { isHold: true, at: holdAt } : { isHold: false, at: reportAt };
  }
  if (holdAt) return { isHold: true, at: holdAt };
  if (reportAt) return { isHold: false, at: reportAt };
  return null;
}

/**
 * 공연이 취소된 예매 안내 — 다른 어떤 안내보다 먼저 보여 준다.
 * 같은 "기한 만료·취소" 표시라도 공연 취소로 정리된 예매는 회원 잘못이 아니므로 문구를 나눈다.
 */
function ConcertCanceledNotice({ order }: { order: OrderDetailView }) {
  if (order.status === 'REFUNDED') {
    return (
      <NoticeBox tone="muted">
        공연이 취소되어 환불이 완료되었습니다.
        {order.refundedAt ? ` (${formatDateTime(order.refundedAt)})` : ''}
      </NoticeBox>
    );
  }

  if (order.status === 'EXPIRED') {
    return (
      <NoticeBox tone="warning">
        공연 취소로 예매가 취소되었습니다. 입금하신 내역이 있다면 등록하신 환불 계좌로 돌려드립니다.
      </NoticeBox>
    );
  }

  return (
    <NoticeBox tone="warning">
      공연이 취소되었습니다. 결제하신 금액은 전액 환불되며, 아래에 환불 계좌를 등록해 주시면 확인 후
      돌려드립니다.
    </NoticeBox>
  );
}

/** 운영자가 취소 요청을 반려한 예매 안내 */
function CancelRejectedNotice({ at }: { at: string }) {
  return (
    <NoticeBox tone="warning">
      취소 요청이 반려되었습니다. 자세한 내용은 고객센터로 문의해 주세요.
      {` (반려 ${formatDateTime(at)})`}
    </NoticeBox>
  );
}

/** 입금 대기 예매 안내 — 반려 이력이 있으면 사유에 맞는 다음 행동을 알려 준다. */
function AwaitingNotice({ order }: { order: OrderDetailView }) {
  const rejection = latestRejection(order);

  if (rejection?.isHold) {
    return (
      <NoticeBox tone="warning">
        보내주신 입금을 예매와 대조하지 못해 입금 대기로 되돌렸어요. 이미 보내신 금액은 등록하신 환불
        계좌로 환불해 드립니다. 관람을 원하시면 정확한 금액·입금자명으로 다시 송금해 주세요.
        {` (반려 ${formatDateTime(rejection.at)})`}
      </NoticeBox>
    );
  }

  if (rejection) {
    return (
      <NoticeBox tone="warning">
        입금이 확인되지 않아 입금 대기로 되돌아갔습니다. 입금 후 다시 요청해 주세요.
        {` (반려 ${formatDateTime(rejection.at)})`}
      </NoticeBox>
    );
  }

  return null;
}

/**
 * 예매 상세의 상태별 안내 박스.
 * 티켓 확인처는 CELEBUS 본앱이므로 지급 관련 안내는 모두 본앱을 가리킨다.
 */
export function OrderStatusNotice({ order }: { order: OrderDetailView }) {
  // 공연 자체가 취소된 예매는 다른 안내보다 이 사실을 먼저 알려야 한다.
  if (order.concertStatus === 'CANCELED') {
    return <ConcertCanceledNotice order={order} />;
  }

  // 취소 요청이 반려돼 원래 상태로 돌아온 예매
  if (
    order.cancelRejectedAt &&
    (order.status === 'DEPOSIT_CONFIRMED' || order.status === 'AWAITING_DEPOSIT')
  ) {
    return <CancelRejectedNotice at={order.cancelRejectedAt} />;
  }

  if (order.status === 'ON_HOLD') {
    return <NoticeBox tone="warning">{order.holdReason ?? HOLD_DEFAULT_REASON}</NoticeBox>;
  }

  if (order.status === 'DEPOSIT_REPORTED') {
    return (
      <NoticeBox tone="info">
        입금 확인 요청이 접수되었습니다. 운영자가 확인하면 입금 확인으로 바뀝니다.
        {order.depositReportedAt ? ` (요청 ${formatDateTime(order.depositReportedAt)})` : ''}
      </NoticeBox>
    );
  }

  if (order.status === 'AWAITING_DEPOSIT') {
    return <AwaitingNotice order={order} />;
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
        취소 요청이 접수되었습니다. 요청 후 24시간 이내에 환불이 처리됩니다. 환불은 아래에 등록하신
        계좌로 보내드리므로, 계좌가 없으면 먼저 등록해 주세요.
      </NoticeBox>
    );
  }

  // 마감·취소 이후 도착한 입금이 남아 있는 예매 — "미입금 취소"가 아니라 환불 절차다.
  if (order.status === 'EXPIRED' && order.hasRefundTargetDeposit) {
    return (
      <NoticeBox tone="accent">
        보내주신 입금이 확인되어 환불 절차가 진행됩니다. 아래에 환불 계좌를 등록해 주시면 확인 후
        돌려드립니다.
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
