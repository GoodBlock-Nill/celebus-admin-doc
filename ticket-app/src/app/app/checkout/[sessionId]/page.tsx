'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { AppHeader } from '../../_components/app-header';
import { DepositGuideCard } from '../../_components/deposit-guide';
import { NotFoundNotice, PageSkeleton } from '../../_components/feedback';
import { NoticeBox } from '../../_components/section';
import { GHOST_BUTTON, PRIMARY_BUTTON } from '../../_components/ui';
import { paidRemaining } from '../../_components/session-option';
import { useOrderExpiry } from '../../_components/use-app-clock';
import { CheckoutForm, type CheckoutSubmitInput } from '../checkout-form';
import { countHeldQty } from '@/lib/store-helpers';
import { selectCurrentVerification, useTicketStore } from '@/lib/store';
import { useHydrated } from '@/lib/use-hydrated';

/** A4 예매 신청 + 입금 안내 */
export default function CheckoutPage() {
  const params = useParams();
  const sessionId = typeof params.sessionId === 'string' ? params.sessionId : '';
  const isHydrated = useHydrated();
  useOrderExpiry();

  const sessions = useTicketStore((state) => state.sessions);
  const concerts = useTicketStore((state) => state.concerts);
  const orders = useTicketStore((state) => state.orders);
  const verification = useTicketStore(selectCurrentVerification);
  const createOrder = useTicketStore((state) => state.createOrder);

  const session = sessions.find((item) => item.id === sessionId);
  const concert = concerts.find((item) => item.id === session?.concertId);
  const concertId = session?.concertId ?? '';
  const heldQty = useTicketStore((state) =>
    concertId ? countHeldQty(state, state.currentUserId, concertId) : 0,
  );

  const [createdOrderId, setCreatedOrderId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const createdOrder = orders.find((order) => order.id === createdOrderId);

  if (!isHydrated) {
    return (
      <main>
        <AppHeader title="예매 신청" backHref="/app" />
        <PageSkeleton rows={3} />
      </main>
    );
  }

  if (!session || !concert) {
    return (
      <main>
        <AppHeader title="예매 신청" backHref="/app" />
        <NotFoundNotice message="회차 정보를 찾을 수 없습니다." backHref="/app" />
      </main>
    );
  }

  const backHref = `/app/concert/${concert.id}`;

  if (!verification) {
    return (
      <main>
        <AppHeader title="예매 신청" backHref={backHref} />
        <div className="flex flex-col gap-4 px-4 py-5">
          <NoticeBox tone="accent">
            티켓 예매에는 최초 1회 휴대폰 본인확인이 필요합니다. 본인확인을 마친 뒤 예매를 이어서 진행해
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
        <div className="flex flex-col gap-4 px-4 py-5">
          <NoticeBox tone="warning">
            아직 예매가 확정되지 않았습니다. 안내된 계좌로 마감 시각까지 입금해 주세요.
          </NoticeBox>
          <DepositGuideCard order={createdOrder} />
          <Link href={`/app/orders/${createdOrder.id}`} className={PRIMARY_BUTTON}>
            주문 내역에서 확인
          </Link>
          <Link href="/app" className={GHOST_BUTTON}>
            홈으로 이동
          </Link>
        </div>
      </main>
    );
  }

  const seatRemaining = paidRemaining(session);
  const limitRemaining = concert.maxPerUser - heldQty;
  const maxQty = Math.max(0, Math.min(concert.maxPerUser, limitRemaining, seatRemaining));

  const handleSubmit = (input: CheckoutSubmitInput) => {
    setErrorMessage('');
    const result = createOrder({
      concertId: concert.id,
      sessionId: session.id,
      qty: input.qty,
      wantsCashReceipt: input.wantsCashReceipt,
      cashReceiptPhone: input.wantsCashReceipt ? input.cashReceiptPhone : undefined,
    });

    if (!result.ok) {
      setErrorMessage(result.reason);
      return;
    }
    setCreatedOrderId(result.order.id);
  };

  return (
    <main>
      <AppHeader title="예매 신청" backHref={backHref} />
      <div className="flex flex-col gap-4 px-4 py-5">
        {maxQty <= 0 ? (
          <>
            <NoticeBox tone="warning">
              {seatRemaining <= 0
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
            defaultPhone={verification.phone}
            errorMessage={errorMessage}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </main>
  );
}
