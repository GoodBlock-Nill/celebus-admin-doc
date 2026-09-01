'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useState } from 'react';

import { AppHeader } from '../../_components/app-header';
import { DepositGuideCard } from '../../_components/deposit-guide';
import { ErrorState, PageSkeleton } from '../../_components/feedback';
import { useMemberSession } from '../../_components/member-session';
import { NoticeBox } from '../../_components/section';
import { GHOST_BUTTON, PRIMARY_BUTTON } from '../../_components/ui';
import { useApiResource } from '../../_components/use-api-resource';
import { CheckoutForm, type CheckoutSubmitInput } from '../checkout-form';
import { ExistingOrderModal, readExistingOrder } from '../existing-order-modal';
import { loadCheckout } from '../load-checkout';
import { api } from '@/lib/api-client';
import type { ExistingOrderInfo, OrderDetailView } from '@/lib/api-types';

/** A4 예매 신청 + 입금 안내 */
export default function CheckoutPage() {
  const params = useParams();
  const sessionId = typeof params.sessionId === 'string' ? params.sessionId : '';
  const { me } = useMemberSession();

  const loader = useCallback(() => loadCheckout(sessionId), [sessionId]);
  const { state, reload } = useApiResource(loader);

  const [createdOrder, setCreatedOrder] = useState<OrderDetailView | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  // 같은 회차에 진행 중인 예매가 있어 멈춘 신청 — 회원이 확인하면 같은 내용으로 다시 보낸다.
  const [existingOrder, setExistingOrder] = useState<ExistingOrderInfo | null>(null);
  const [pendingInput, setPendingInput] = useState<CheckoutSubmitInput | null>(null);

  if (state.status === 'LOADING') {
    return (
      <main>
        <AppHeader title="예매 신청" backHref="/app" />
        <PageSkeleton rows={3} />
      </main>
    );
  }

  if (state.status === 'ERROR') {
    return (
      <main>
        <AppHeader title="예매 신청" backHref="/app" />
        <div className="flex flex-col gap-4 px-4 pb-5">
          <ErrorState message={state.reason} onRetry={() => void reload()} />
          <Link href="/app" className={GHOST_BUTTON}>
            목록으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const { concert, session, heldQty } = state.data;
  const backHref = `/app/concert/${concert.id}`;

  if (!me.verified) {
    return (
      <main>
        <AppHeader title="예매 신청" backHref={backHref} />
        <div className="flex flex-col gap-4 px-4 pb-5">
          <NoticeBox tone="accent">
            티켓 예매에는 최초 1회 간편인증 본인확인이 필요합니다. 본인확인을 마친 뒤 예매를 이어서 진행해
            주세요.
          </NoticeBox>
          <Link href={`/app/verify?next=/app/checkout/${session.id}`} className={PRIMARY_BUTTON}>
            본인확인 하러가기
          </Link>
        </div>
      </main>
    );
  }

  if (createdOrder) {
    return (
      <main>
        <AppHeader title="입금 안내" backHref="/app/orders" />
        <div className="flex flex-col gap-4 px-4 pb-5">
          <NoticeBox tone="warning">
            아직 예매가 확정되지 않았습니다. 안내된 계좌로 마감 시각까지 입금해 주세요.
          </NoticeBox>
          <DepositGuideCard order={createdOrder} />
          {/* 주요 행동은 입금 안내 카드의 송금 버튼이므로 이동 링크는 보조 버튼으로 나란히 둔다. */}
          <div className="grid grid-cols-2 gap-2">
            <Link href={`/app/orders/${createdOrder.id}`} className={GHOST_BUTTON}>
              예매 내역에서 확인
            </Link>
            <Link href="/app" className={GHOST_BUTTON}>
              홈으로 이동
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const limitRemaining = concert.maxPerUser - heldQty;
  const maxQty = Math.max(0, Math.min(concert.maxPerUser, limitRemaining, session.remaining));

  const handleSubmit = async (input: CheckoutSubmitInput, allowAdditional = false) => {
    if (isSubmitting) return;

    setSubmitting(true);
    setErrorMessage('');
    // 본인확인 번호로 발급할 때는 번호를 보내지 않는다 — 서버가 보관 중인 값을 사용한다.
    const usesManualPhone = input.wantsCashReceipt && input.cashReceiptSource === 'manual';
    const created = await api.createOrder({
      sessionId: session.id,
      qty: input.qty,
      wantsCashReceipt: input.wantsCashReceipt,
      cashReceiptSource: input.cashReceiptSource,
      cashReceiptPhone: usesManualPhone ? input.cashReceiptPhone : undefined,
      ...(allowAdditional ? { allowAdditional: true } : {}),
    });

    if (!created.ok) {
      setSubmitting(false);

      // 같은 회차에 진행 중인 예매가 있는 경우 — 오류 문구 대신 선택을 묻는다.
      const existing = readExistingOrder(created.body);
      if (existing) {
        setPendingInput(input);
        setExistingOrder(existing);
        return;
      }

      setErrorMessage(created.reason);
      return;
    }

    setExistingOrder(null);
    setPendingInput(null);

    const detail = await api.order(created.data.orderId);
    setSubmitting(false);

    if (!detail.ok) {
      setErrorMessage(detail.reason);
      return;
    }
    setCreatedOrder(detail.data.order);
  };

  return (
    <main>
      <AppHeader title="예매 신청" backHref={backHref} />
      <div className="flex flex-col gap-4 px-4 pb-5">
        {maxQty <= 0 ? (
          <>
            <NoticeBox tone="warning">
              {session.remaining <= 0
                ? '해당 회차의 잔여 좌석이 모두 소진되었습니다.'
                : `1인 최대 ${concert.maxPerUser}매까지 예매할 수 있습니다. (현재 보유 ${heldQty}매)`}
            </NoticeBox>
            <Link href={backHref} className={GHOST_BUTTON}>
              다른 회차 보기
            </Link>
          </>
        ) : (
          <CheckoutForm
            concert={concert}
            session={session}
            maxQty={maxQty}
            heldQty={heldQty}
            verifiedPhoneMasked={me.verification?.phoneMasked ?? ''}
            errorMessage={errorMessage}
            busy={isSubmitting}
            onSubmit={(input) => void handleSubmit(input)}
          />
        )}

        <ExistingOrderModal
          info={existingOrder}
          busy={isSubmitting}
          onClose={() => setExistingOrder(null)}
          onProceed={() => {
            if (!pendingInput) return;
            setExistingOrder(null);
            void handleSubmit(pendingInput, true);
          }}
        />
      </div>
    </main>
  );
}
