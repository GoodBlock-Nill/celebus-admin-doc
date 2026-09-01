'use client';

import { NoticeBox, SectionCard } from '../_components/section';
import { HoldRefundBlock } from './hold-refund-block';
import type { OrderDetailView } from '@/lib/api-types';

/**
 * 환불 계좌 등록 구획 — 돈을 돌려줘야 하는 예매에 상시 노출한다.
 *
 * 노출 대상
 *   · 취소·환불 요청을 접수한 예매        → 계좌가 있어야 환불을 승인할 수 있다
 *   · 보류 반려로 입금 대기에 되돌아온 예매 → 이미 보낸 돈을 돌려받아야 한다
 *   · 반환 대상 입금이 연결된 예매         → 마감·취소 이후 도착한 입금을 돌려받아야 한다
 *
 * 계좌가 없으면 경고와 함께 입력 폼을, 등록돼 있으면 마스킹 값과 [수정]을 보여 준다.
 * 입력 폼·저장 경로는 확인 보류 해결 화면과 같은 것을 그대로 쓴다.
 */
export function RefundAccountSection({
  order,
  onDone,
}: {
  order: OrderDetailView;
  onDone?: () => void;
}) {
  const isRegistered = Boolean(order.refundBank && order.refundAccountMasked && order.refundHolder);

  return (
    <SectionCard
      title="환불 계좌"
      description="환불은 등록하신 계좌로 처리됩니다. 계좌번호는 안전하게 보관되며 환불에만 사용해요."
    >
      <div className="flex flex-col gap-3">
        {isRegistered ? null : (
          <NoticeBox tone="warning">
            환불 계좌가 아직 등록되지 않았어요. 환불은 계좌 등록 후 처리됩니다.
          </NoticeBox>
        )}
        <HoldRefundBlock order={order} onDone={onDone} />
      </div>
    </SectionCard>
  );
}
