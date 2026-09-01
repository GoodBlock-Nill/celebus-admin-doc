'use client';

import { DEPOSIT_STATUS_VIEW } from '../../../_components/labels';
import { Badge, StatusBadge } from '../../../_components/ui';
import type { AdminOrderSearchView } from '@/lib/admin-types';
import { formatDateTime, formatKrw } from '@/lib/format';

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1">
      <span className="w-[100px] shrink-0 text-[12px] text-[#6B7080]">{label}</span>
      <span className="flex-1 text-[12.5px] leading-relaxed text-[#1B1D22]">{children}</span>
    </div>
  );
}

/** 주문 조회 행 확장 — 고객 문의에 답하는 데 필요한 이력 */
export function OrderSearchDetail({ order }: { order: AdminOrderSearchView }) {
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <div className="rounded-lg border border-[#E3E5EA] bg-white px-3 py-2">
        <Line label="신청">{formatDateTime(order.createdAt)}</Line>
        <Line label="입금 마감">{formatDateTime(order.depositDeadline)}</Line>
        <Line label="입금 확인 요청">
          {order.depositReportedAt
            ? `${formatDateTime(order.depositReportedAt)} (누적 ${order.depositReportCount}회)`
            : '없음'}
        </Line>
        <Line label="입금 확인">
          {order.depositConfirmedAt ? formatDateTime(order.depositConfirmedAt) : '없음'}
        </Line>
        <Line label="취소 요청">
          {order.cancelRequestedAt ? formatDateTime(order.cancelRequestedAt) : '없음'}
          {order.cancelRejectedAt ? ` · 반려 ${formatDateTime(order.cancelRejectedAt)}` : ''}
        </Line>
        <Line label="환불">
          {order.refundedAt
            ? `${formatDateTime(order.refundedAt)} · 수수료 ${formatKrw(order.refundFeeKrw ?? 0)} · 실환불 ${formatKrw(
                order.refundAmountKrw ?? 0,
              )}`
            : '없음'}
        </Line>
      </div>

      <div className="flex flex-col gap-2">
        <div className="rounded-lg border border-[#E3E5EA] bg-white px-3 py-2">
          <Line label="티켓">
            유효 {order.ticketCount}매{order.revokedTicketCount > 0 ? ` · 회수 ${order.revokedTicketCount}매` : ''}
          </Line>
          <Line label="환불 계좌">
            {order.refundBank && order.refundAccountMasked
              ? `${order.refundBank} ${order.refundAccountMasked} · 예금주 ${order.refundHolder}`
              : '등록 없음'}
          </Line>
          <Line label="보류 사유">{order.holdReason ?? '없음'}</Line>
        </div>

        <div className="rounded-lg border border-[#E3E5EA] bg-white px-3 py-2">
          <p className="pb-1 text-[12px] font-bold text-[#4A4E5A]">연결 입금 ({order.deposits.length}건)</p>
          {order.deposits.length === 0 ? (
            <p className="text-[12px] text-[#6B7080]">연결된 입금이 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {order.deposits.map((deposit) => (
                <li key={deposit.id} className="flex flex-wrap items-center gap-2 text-[12px]">
                  <StatusBadge view={DEPOSIT_STATUS_VIEW[deposit.status]} />
                  <span className="font-semibold text-[#1B1D22]">{deposit.depositorName}</span>
                  <span className="tabular-nums">{formatKrw(deposit.amountKrw)}</span>
                  <span className="tabular-nums text-[#6B7080]">
                    {formatDateTime(deposit.depositedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Badge>고객 문의 대응용 조회 화면 — 여기서는 상태를 바꾸지 않습니다</Badge>
      </div>
    </div>
  );
}
