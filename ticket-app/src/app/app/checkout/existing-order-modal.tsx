'use client';

import Link from 'next/link';

import { AppModal } from '../_components/modal';
import { ORDER_STATUS_META } from '../_components/status-meta';
import { GHOST_BUTTON, PRIMARY_BUTTON } from '../_components/ui';
import type { ExistingOrderInfo, OrderStatus } from '@/lib/api-types';
import { formatDateTimeWithWeekday, formatKrw } from '@/lib/format';

/** 같은 회차에 진행 중인 예매가 있어 신청이 멈췄음을 알리는 구분값 */
const EXISTING_ORDER_CODE = 'EXISTING_ORDER';

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && value in ORDER_STATUS_META;
}

/**
 * 서버가 실패 응답에 함께 담아 준 기존 예매 정보를 읽는다.
 * 형식이 어긋나면 null을 돌려주고 화면은 일반 오류 문구를 보여 준다.
 */
export function readExistingOrder(body: Record<string, unknown> | undefined): ExistingOrderInfo | null {
  if (!body || body.code !== EXISTING_ORDER_CODE) return null;

  const order = body.existingOrder as Record<string, unknown> | undefined;
  if (!order || typeof order.orderId !== 'string' || typeof order.orderNo !== 'string') return null;
  if (!isOrderStatus(order.status)) return null;

  return {
    orderId: order.orderId,
    orderNo: order.orderNo,
    status: order.status,
    qty: Number(order.qty),
    amountKrw: Number(order.amountKrw),
    depositDeadline: String(order.depositDeadline),
  };
}

/**
 * 중복 신청 안내 (재설계서 A-10).
 * 되돌아가기·새로고침으로 같은 회차를 두 번 신청하면 좌석이 두 번 잡히므로,
 * 기존 예매를 먼저 보여 주고 정말 추가로 예매할 것인지 확인한다.
 */
export function ExistingOrderModal({
  info,
  busy,
  onClose,
  onProceed,
}: {
  info: ExistingOrderInfo | null;
  busy: boolean;
  onClose: () => void;
  /** 추가 예매를 선택했을 때 — 같은 내용으로 다시 신청한다 */
  onProceed: () => void;
}) {
  if (!info) return null;

  return (
    <AppModal
      open
      title="이미 진행 중인 예매가 있어요"
      description={
        <>
          이 회차에 <strong>{info.orderNo}</strong> 예매가 진행 중입니다. (
          {ORDER_STATUS_META[info.status].label} · {info.qty}매 · {formatKrw(info.amountKrw)})
          <br />
          입금 마감 {formatDateTimeWithWeekday(info.depositDeadline)}까지 입금하면 예매가 확정됩니다.
          <br />
          같은 회차를 한 번 더 예매하려면 아래에서 추가 예매를 선택해 주세요.
        </>
      }
      onClose={onClose}
      footer={
        <>
          <Link href={`/app/orders/${info.orderId}`} className={PRIMARY_BUTTON}>
            기존 예매 보기
          </Link>
          <button type="button" onClick={onProceed} disabled={busy} className={GHOST_BUTTON}>
            {busy ? '신청 중…' : '추가로 예매하기'}
          </button>
        </>
      }
    />
  );
}
