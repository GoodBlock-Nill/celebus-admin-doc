'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useState } from 'react';

import { AppHeader } from '../../_components/app-header';
import { Badge } from '../../_components/badge';
import { DepositGuideCard } from '../../_components/deposit-guide';
import { ErrorBanner, ErrorState, PageSkeleton } from '../../_components/feedback';
import { SectionCard } from '../../_components/section';
import {
  ORDER_STATUS_META,
  canCancelBeforeDeposit,
  canRequestCancel,
  needsDepositGuide,
} from '../../_components/status-meta';
import { DANGER_BUTTON, GHOST_BUTTON, MUTED, PRIMARY_BUTTON } from '../../_components/ui';
import { useApiResource } from '../../_components/use-api-resource';
import { CancelModals, type CancelModalKind } from '../cancel-modals';
import { DepositReportActions } from '../deposit-report-actions';
import { HoldFlowCard } from '../hold-view';
import { OrderInfoCard } from '../order-info-card';
import { OrderStatusNotice } from '../order-status-notice';
import { PinnedActionBar } from '../pinned-action-bar';
import { RefundAccountSection } from '../refund-account-section';
import { ReportedView } from '../reported-view';
import { OrderTimeline } from '../order-timeline';
import { api } from '@/lib/api-client';
import { CELEBUS_APP_URL } from '@/lib/constants';

/** A5 예매 상세 */
export default function OrderDetailPage() {
  const params = useParams();
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';

  const loadOrder = useCallback(() => api.order(orderId), [orderId]);
  const { state, reload } = useApiResource(loadOrder);

  const [openModal, setOpenModal] = useState<CancelModalKind>('NONE');
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
  const showsDepositGuide = needsDepositGuide(order.status);
  // 입금 대기에서는 하단 고정 액션바가 핵심 행동(토스 송금·입금확인 요청)을 상시 노출한다.
  const showsPinnedBar = order.status === 'AWAITING_DEPOSIT';
  // 입금 확인중은 대기 중심 구성(처리중 히어로·가로 스텝퍼·송금 정보 접힘)으로 바꾼다.
  const isReported = order.status === 'DEPOSIT_REPORTED';
  // 확인 보류는 해결 플로우 카드(다른 점·지금 할 일·확인되면)가 안내와 계좌 섹션을 대신한다.
  const isHold = order.status === 'ON_HOLD';
  const hasRefundAccount = Boolean(
    order.refundBank && order.refundAccountMasked && order.refundHolder,
  );
  // 돈을 돌려줘야 하는 예매에는 상태와 무관하게 환불 계좌 등록 구획을 연다.
  //   · 취소·환불 요청 접수  · 보류 반려로 되돌아온 입금 대기  · 반환 대상 입금이 남은 예매
  const showsRefundAccount =
    !isHold &&
    (order.status === 'CANCEL_REQUESTED' ||
      (order.status === 'AWAITING_DEPOSIT' && Boolean(order.holdRejectedAt)) ||
      order.hasRefundTargetDeposit);

  const refundAccountSection = showsRefundAccount ? (
    <RefundAccountSection order={order} onDone={() => void reload()} />
  ) : null;

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

      <div className={`flex flex-col gap-3.5 px-4 ${showsPinnedBar ? 'pb-24' : 'pb-5'}`}>
        {isReported ? <ReportedView order={order} /> : null}
        {isHold ? <HoldFlowCard order={order} onDone={() => void reload()} /> : null}

        {isReported ? null : (
          <>
            <OrderInfoCard order={order} />
            <SectionCard title="진행 상태">
              <OrderTimeline order={order} />
            </SectionCard>
          </>
        )}

        {/* 입금 대기에서는 안내 박스를 계좌 안내 위에 둔다. 확인중·보류는 전용 구성이 대신한다. */}
        {showsDepositGuide && !isReported && !isHold ? <OrderStatusNotice order={order} /> : null}

        {/* 보류 반려로 되돌아온 예매는 재송금 안내보다 환불 계좌 등록을 먼저 보여 준다. */}
        {showsDepositGuide ? refundAccountSection : null}

        {showsDepositGuide && !isReported && !isHold ? (
          <>
            <h2 className="px-1 text-[16px] font-bold text-[#191F28]">입금 계좌 확인</h2>
            <DepositGuideCard order={order} />
          </>
        ) : null}

        {showsDepositGuide ? null : <OrderStatusNotice order={order} />}

        {showsDepositGuide ? null : refundAccountSection}

        {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

        <div className="flex flex-col gap-2">
          {/* 입금 대기의 요청 버튼은 하단 고정 액션바가 담당한다 (요청 취소 등 나머지 상태만 본문 렌더) */}
          {showsPinnedBar ? null : (
            <DepositReportActions
              order={order}
              onDone={() => void reload()}
              onFail={setErrorMessage}
            />
          )}

          {/* 발권·입장 확인은 CELEBUS 본앱이 담당하므로 티켓이 지급된 예매는 본앱으로 보낸다. */}
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

          {canCancelBeforeDeposit(order.status) ? (
            <button
              type="button"
              onClick={() => setOpenModal('CANCEL_AWAITING')}
              className={DANGER_BUTTON}
            >
              예매 취소
            </button>
          ) : null}

          {/* 입금 확인중에는 운영자가 입금 내역을 대조하므로 취소 경로를 요청 취소로 한정한다. */}
          {isReported ? (
            <p className={`px-1 text-[12.5px] leading-relaxed ${MUTED}`}>
              입금 확인중에는 예매를 취소할 수 없어요. 취소가 필요하면 먼저 입금확인 요청을 취소해
              주세요.
            </p>
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

        {/* 티켓 지급은 공연 당일에 이뤄지므로 지급된 예매는 취소·환불 안내 대신 불가 안내를 노출한다. */}
        {order.status === 'PAID' ? (
          <p className={`px-1 text-[12.5px] leading-relaxed ${MUTED}`}>
            티켓이 지급된 예매는 취소·환불이 불가능합니다.
          </p>
        ) : isReported ? null : (
          <p className={`px-1 text-[12.5px] leading-relaxed ${MUTED}`}>
            환불 수수료는 관람일 기준으로 단계별 적용됩니다. 자세한 내용은 공연 상세의 환불 정책을 확인해
            주세요.
          </p>
        )}
      </div>

      {showsPinnedBar ? (
        <PinnedActionBar order={order} onDone={() => void reload()} onFail={setErrorMessage} />
      ) : null}

      <CancelModals
        kind={openModal}
        hasRefundAccount={hasRefundAccount}
        onConfirm={() => void handleCancel()}
        onClose={() => setOpenModal('NONE')}
      />
    </main>
  );
}
