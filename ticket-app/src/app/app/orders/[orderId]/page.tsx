'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { AppHeader } from '../../_components/app-header';
import { Badge } from '../../_components/badge';
import { DepositGuideCard } from '../../_components/deposit-guide';
import { ErrorBanner, NotFoundNotice, PageSkeleton } from '../../_components/feedback';
import { ConfirmModal } from '../../_components/modal';
import { InfoRow, NoticeBox, SectionCard } from '../../_components/section';
import { ORDER_STATUS_META, needsDepositGuide } from '../../_components/status-meta';
import { DANGER_BUTTON, GHOST_BUTTON, MUTED, PRIMARY_BUTTON } from '../../_components/ui';
import { useOrderExpiry } from '../../_components/use-app-clock';
import { OrderTimeline } from '../order-timeline';
import { formatDateTime, formatKrw, maskPhone } from '@/lib/format';
import { useTicketStore } from '@/lib/store';
import { useHydrated } from '@/lib/use-hydrated';

type OpenModal = 'NONE' | 'CANCEL_AWAITING' | 'REQUEST_CANCEL';

/** A5 주문 상세 */
export default function OrderDetailPage() {
  const params = useParams();
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';
  const isHydrated = useHydrated();
  useOrderExpiry();

  const orders = useTicketStore((state) => state.orders);
  const concerts = useTicketStore((state) => state.concerts);
  const sessions = useTicketStore((state) => state.sessions);
  const tickets = useTicketStore((state) => state.tickets);
  const cancelAwaitingOrder = useTicketStore((state) => state.cancelAwaitingOrder);
  const requestCancel = useTicketStore((state) => state.requestCancel);

  const [openModal, setOpenModal] = useState<OpenModal>('NONE');
  const [errorMessage, setErrorMessage] = useState('');

  const order = orders.find((item) => item.id === orderId);

  if (!isHydrated) {
    return (
      <main>
        <AppHeader title="주문 상세" backHref="/app/orders" />
        <PageSkeleton rows={3} />
      </main>
    );
  }

  if (!order) {
    return (
      <main>
        <AppHeader title="주문 상세" backHref="/app/orders" />
        <NotFoundNotice message="주문 정보를 찾을 수 없습니다." backHref="/app/orders" />
      </main>
    );
  }

  const concert = concerts.find((item) => item.id === order.concertId);
  const session = sessions.find((item) => item.id === order.sessionId);
  const orderTickets = tickets.filter((ticket) => ticket.orderId === order.id);
  const statusMeta = ORDER_STATUS_META[order.status];

  const runAction = (action: () => { ok: true } | { ok: false; reason: string }) => {
    const result = action();
    setErrorMessage(result.ok ? '' : result.reason);
    setOpenModal('NONE');
  };

  return (
    <main>
      <AppHeader
        title="주문 상세"
        backHref="/app/orders"
        right={<Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>}
      />

      <div className="flex flex-col gap-3.5 px-4 py-5">
        <SectionCard title="주문 정보">
          <InfoRow label="주문번호" value={order.orderNo} />
          <InfoRow label="공연" value={concert?.title ?? '-'} />
          <InfoRow label="회차" value={session?.name ?? '-'} />
          <InfoRow label="관람 일시" value={session ? formatDateTime(session.startAt) : '-'} />
          <InfoRow label="매수" value={`${order.qty}매`} />
          <InfoRow label="결제 금액" value={formatKrw(order.amountKrw)} emphasis />
          <InfoRow label="신청 일시" value={formatDateTime(order.createdAt)} />
          <InfoRow
            label="현금영수증"
            value={
              order.wantsCashReceipt
                ? `신청 (${order.cashReceiptPhone ? maskPhone(order.cashReceiptPhone) : '번호 미입력'})`
                : '미신청'
            }
          />
        </SectionCard>

        <SectionCard title="진행 상태">
          <OrderTimeline order={order} ticketIssuedAt={orderTickets[0]?.issuedAt} />
        </SectionCard>

        {order.status === 'ON_HOLD' ? (
          <NoticeBox tone="warning">
            {order.holdReason ??
              '입금자명이 일치하지 않아 확인 중입니다. 운영자 확인 후 안내해 드리겠습니다.'}
          </NoticeBox>
        ) : null}

        {needsDepositGuide(order.status) ? (
          <>
            <h2 className="px-1 text-[14px] font-bold">입금 계좌 확인</h2>
            <DepositGuideCard order={order} />
          </>
        ) : null}

        {order.status === 'CANCEL_REQUESTED' ? (
          <NoticeBox tone="accent">
            취소 요청이 접수되었습니다. 요청 후 24시간 이내에 환불이 처리됩니다.
          </NoticeBox>
        ) : null}

        {order.status === 'REFUNDED' ? (
          <NoticeBox tone="muted">
            환불이 완료되었습니다. 발급되었던 티켓은 회수 처리되었습니다.
            {order.refundedAt ? ` (${formatDateTime(order.refundedAt)})` : ''}
          </NoticeBox>
        ) : null}

        {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

        <div className="flex flex-col gap-2">
          {order.status === 'PAID' ? (
            <Link href="/app/tickets" className={PRIMARY_BUTTON}>
              내 티켓 보기
            </Link>
          ) : null}

          {needsDepositGuide(order.status) ? (
            <button
              type="button"
              onClick={() => setOpenModal('CANCEL_AWAITING')}
              className={DANGER_BUTTON}
            >
              주문 취소
            </button>
          ) : null}

          {order.status === 'PAID' ? (
            <button
              type="button"
              onClick={() => setOpenModal('REQUEST_CANCEL')}
              className={GHOST_BUTTON}
            >
              취소·환불 요청
            </button>
          ) : null}
        </div>

        <p className={`px-1 text-[11.5px] leading-relaxed ${MUTED}`}>
          환불 수수료는 관람일 기준으로 단계별 적용됩니다. 자세한 내용은 공연 상세의 환불 정책을 확인해
          주세요.
        </p>
      </div>

      <ConfirmModal
        open={openModal === 'CANCEL_AWAITING'}
        title="주문을 취소할까요?"
        description="입금 전 주문은 수수료 없이 즉시 취소되며, 확보된 좌석은 바로 반환됩니다."
        confirmLabel="주문 취소하기"
        onConfirm={() => runAction(() => cancelAwaitingOrder(order.id))}
        onClose={() => setOpenModal('NONE')}
      />

      <ConfirmModal
        open={openModal === 'REQUEST_CANCEL'}
        title="취소·환불을 요청할까요?"
        description="요청 후 24시간 이내에 처리됩니다. 환불이 승인되면 발급된 티켓은 회수됩니다."
        confirmLabel="취소·환불 요청하기"
        onConfirm={() => runAction(() => requestCancel(order.id))}
        onClose={() => setOpenModal('NONE')}
      />
    </main>
  );
}
