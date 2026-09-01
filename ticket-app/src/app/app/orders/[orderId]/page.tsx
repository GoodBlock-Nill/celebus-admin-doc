'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useState } from 'react';

import { AppHeader } from '../../_components/app-header';
import { Badge } from '../../_components/badge';
import { DepositGuideCard } from '../../_components/deposit-guide';
import { ErrorBanner, ErrorState, PageSkeleton } from '../../_components/feedback';
import { ConfirmModal } from '../../_components/modal';
import { InfoRow, SectionCard } from '../../_components/section';
import { ORDER_STATUS_META, canRequestCancel, needsDepositGuide } from '../../_components/status-meta';
import { DANGER_BUTTON, GHOST_BUTTON, MUTED, PRIMARY_BUTTON } from '../../_components/ui';
import { useApiResource } from '../../_components/use-api-resource';
import { OrderStatusNotice } from '../order-status-notice';
import { OrderTimeline } from '../order-timeline';
import { api } from '@/lib/api-client';
import { CELEBUS_APP_URL } from '@/lib/constants';
import { formatDateTime, formatKrw } from '@/lib/format';

type OpenModal = 'NONE' | 'CANCEL_AWAITING' | 'REQUEST_CANCEL';

/** A5 예매 상세 */
export default function OrderDetailPage() {
  const params = useParams();
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';

  const loadOrder = useCallback(() => api.order(orderId), [orderId]);
  const { state, reload } = useApiResource(loadOrder);

  const [openModal, setOpenModal] = useState<OpenModal>('NONE');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  if (state.status === 'LOADING') {
    return (
      <main>
        <AppHeader title="예매 상세" backHref="/app/orders" />
        <PageSkeleton rows={3} />
      </main>
    );
  }

  if (state.status === 'ERROR') {
    return (
      <main>
        <AppHeader title="예매 상세" backHref="/app/orders" />
        <div className="flex flex-col gap-4 px-4 pb-5">
          <ErrorState message={state.reason} onRetry={() => void reload()} />
          <Link href="/app/orders" className={GHOST_BUTTON}>
            목록으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const order = state.data.order;
  const statusMeta = ORDER_STATUS_META[order.status];

  const handleCancel = async () => {
    if (isSubmitting) return;

    setSubmitting(true);
    const result = await api.cancelOrder(order.id);
    setSubmitting(false);
    setOpenModal('NONE');
    setErrorMessage(result.ok ? '' : result.reason);
    if (result.ok) await reload();
  };

  return (
    <main>
      <AppHeader
        title="예매 상세"
        backHref="/app/orders"
        right={<Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>}
      />

      <div className="flex flex-col gap-3.5 px-4 pb-5">
        <SectionCard title="예매 정보">
          <InfoRow label="예매번호" value={order.orderNo} />
          <InfoRow label="공연" value={order.concertTitle} />
          <InfoRow label="회차" value={order.sessionName} />
          <InfoRow
            label="관람 일시"
            value={order.sessionStartAt ? formatDateTime(order.sessionStartAt) : '-'}
          />
          <InfoRow label="매수" value={`${order.qty}매`} />
          <InfoRow label="결제 금액" value={formatKrw(order.amountKrw)} emphasis />
          <InfoRow label="신청 일시" value={formatDateTime(order.createdAt)} />
          <InfoRow
            label="현금영수증"
            value={
              order.wantsCashReceipt
                ? `신청 (${order.cashReceiptPhoneMasked ?? '번호 미입력'})`
                : '미신청'
            }
          />
        </SectionCard>

        <SectionCard title="진행 상태">
          <OrderTimeline order={order} />
        </SectionCard>

        {/* 입금 안내는 보류 상태에서도 다시 보여줘야 하므로 상태 안내 박스와 순서를 나눠 배치한다. */}
        {order.status === 'ON_HOLD' ? <OrderStatusNotice order={order} /> : null}

        {needsDepositGuide(order.status) ? (
          <>
            <h2 className="px-1 text-[16px] font-bold text-[#191F28]">입금 계좌 확인</h2>
            <DepositGuideCard order={order} />
          </>
        ) : null}

        {order.status === 'ON_HOLD' ? null : <OrderStatusNotice order={order} />}

        {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

        <div className="flex flex-col gap-2">
          {/* 발권·입장 확인은 CELEBUS 본앱이 담당하므로 지급 완료 예매는 본앱으로 보낸다. */}
          {order.status === 'PAID' ? (
            <a
              href={CELEBUS_APP_URL}
              target="_blank"
              rel="noreferrer"
              className={PRIMARY_BUTTON}
            >
              CELEBUS 앱에서 티켓 확인
            </a>
          ) : null}

          {needsDepositGuide(order.status) ? (
            <button
              type="button"
              onClick={() => setOpenModal('CANCEL_AWAITING')}
              className={DANGER_BUTTON}
            >
              예매 취소
            </button>
          ) : null}

          {canRequestCancel(order.status) ? (
            <button
              type="button"
              onClick={() => setOpenModal('REQUEST_CANCEL')}
              className={GHOST_BUTTON}
            >
              취소·환불 요청
            </button>
          ) : null}
        </div>

        <p className={`px-1 text-[12.5px] leading-relaxed ${MUTED}`}>
          환불 수수료는 관람일 기준으로 단계별 적용됩니다. 자세한 내용은 공연 상세의 환불 정책을 확인해
          주세요.
        </p>
      </div>

      <ConfirmModal
        open={openModal === 'CANCEL_AWAITING'}
        title="예매를 취소할까요?"
        description="입금 전 예매는 수수료 없이 즉시 취소되며, 확보된 좌석은 바로 반환됩니다."
        confirmLabel="예매 취소하기"
        onConfirm={() => void handleCancel()}
        onClose={() => setOpenModal('NONE')}
      />

      <ConfirmModal
        open={openModal === 'REQUEST_CANCEL'}
        title="취소·환불을 요청할까요?"
        description={
          order.status === 'DEPOSIT_CONFIRMED'
            ? '요청 후 24시간 이내에 처리됩니다. 아직 티켓이 지급되지 않은 예매로, 환불이 승인되면 확보된 좌석은 반환됩니다.'
            : '요청 후 24시간 이내에 처리됩니다. 환불이 승인되면 발급된 티켓은 회수됩니다.'
        }
        confirmLabel="취소·환불 요청하기"
        onConfirm={() => void handleCancel()}
        onClose={() => setOpenModal('NONE')}
      />
    </main>
  );
}
