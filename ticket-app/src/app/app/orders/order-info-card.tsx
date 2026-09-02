import { InfoRow, SectionCard } from '../_components/section';
import type { OrderDetailView } from '@/lib/api-types';
import { formatDateTime, formatKrw } from '@/lib/format';

/** 예매 정보 행 묶음 — 카드 없이 재사용할 수 있게 분리 */
export function OrderInfoRows({ order }: { order: OrderDetailView }) {
  return (
    <>
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
    </>
  );
}

/** 예매 정보 카드 — 예매 상세 기본 구성용 전체 항목 */
export function OrderInfoCard({ order }: { order: OrderDetailView }) {
  return (
    <SectionCard title="예매 정보">
      <OrderInfoRows order={order} />
    </SectionCard>
  );
}
