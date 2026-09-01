'use client';

import type { Column } from '../../_components/data-table';
import { DEPOSIT_STATUS_VIEW, HOLD_CAUSE_VIEW } from '../../_components/labels';
import { Badge, StatusBadge } from '../../_components/ui';
import type { AdminDepositView } from '@/lib/admin-types';
import { formatDateTime, formatKrw } from '@/lib/format';

export const depositorColumn: Column<AdminDepositView> = {
  key: 'depositor',
  header: '입금자명',
  width: '130px',
  render: (row) => <span className="font-semibold">{row.depositorName}</span>,
};

export const amountColumn: Column<AdminDepositView> = {
  key: 'amount',
  header: '입금액',
  numeric: true,
  width: '110px',
  render: (row) => formatKrw(row.amountKrw),
};

export const depositedAtColumn: Column<AdminDepositView> = {
  key: 'depositedAt',
  header: '입금 시각',
  width: '140px',
  render: (row) => (
    <span className="whitespace-nowrap tabular-nums text-[12px] text-[#4A4E5A]">
      {formatDateTime(row.depositedAt)}
    </span>
  ),
};

export const statusColumn: Column<AdminDepositView> = {
  key: 'status',
  header: '상태',
  width: '120px',
  render: (row) => <StatusBadge view={DEPOSIT_STATUS_VIEW[row.status]} />,
};

export const orderColumn: Column<AdminDepositView> = {
  key: 'order',
  header: '매칭 주문 / 주문자',
  render: (row) =>
    row.order ? (
      <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-1.5">
          <span className="font-semibold tabular-nums">{row.order.orderNo}</span>
          {/* 회원이 입금 확인을 요청한 주문은 우선 확인 대상임을 표시한다 */}
          {row.order.depositReportedAt ? (
            <Badge tone="accent">회원 요청 {formatDateTime(row.order.depositReportedAt)}</Badge>
          ) : null}
        </span>
        <span className="text-[12px] text-[#6B7080]">
          {row.order.party.realName}
          {row.order.party.nickname ? ` (${row.order.party.nickname})` : ''} · {row.order.qty}매 ·{' '}
          {formatKrw(row.order.amountKrw)}
        </span>
      </div>
    ) : (
      <span className="text-[12px] text-[#6B7080]">연결된 주문 없음</span>
    ),
};

/**
 * 회원이 확인 보류를 풀려고 알려 온 정보.
 * 실제 입금자명은 은행 내역 대조의 직접적인 힌트이므로 강조해 보여 준다.
 */
export const holdSubmissionColumn: Column<AdminDepositView> = {
  key: 'holdSubmission',
  header: '회원이 알린 정보',
  width: '260px',
  render: (row) => {
    const order = row.order;
    if (!order || !order.holdInfoSubmittedAt) {
      return <span className="text-[12px] text-[#6B7080]">알려온 정보 없음</span>;
    }

    return (
      <div className="flex flex-col gap-1">
        {order.holdActualDepositor ? (
          <span className="flex flex-wrap items-center gap-1.5">
            <Badge tone="accent">실제 입금자명</Badge>
            <span className="text-[13px] font-semibold text-[#191F28]">
              {order.holdActualDepositor}
            </span>
          </span>
        ) : null}
        {order.refundBank && order.refundAccountMasked ? (
          <span className="text-[12px] text-[#4A4E5A]">
            환불 계좌 {order.refundBank} {order.refundAccountMasked} · 예금주 {order.refundHolder}
          </span>
        ) : null}
        <span className="text-[11.5px] tabular-nums text-[#6B7080]">
          전달 {formatDateTime(order.holdInfoSubmittedAt)}
        </span>
      </div>
    );
  },
};

/**
 * 대조 힌트 — 자동 매칭이 멈춘 이유와 이어 붙일 후보를 알려 준다.
 * 동일 조건 예매가 여럿이면 자동 매칭을 하지 않으므로 운영자가 직접 골라야 한다(B-5).
 * 나눠 들어온 입금은 합계가 맞는 예매를 함께 알려 준다(B-6).
 */
export const matchHintColumn: Column<AdminDepositView> = {
  key: 'matchHint',
  header: '대조 힌트',
  width: '250px',
  render: (row) => {
    if (!row.splitHint && row.matchCandidates.length === 0) {
      return <span className="text-[12px] text-[#6B7080]">-</span>;
    }

    return (
      <div className="flex flex-col gap-1.5">
        {row.splitHint ? (
          <span className="flex flex-col gap-0.5">
            <Badge tone="accent">분할 입금 후보</Badge>
            <span className="text-[12px] leading-relaxed text-[#4A4E5A]">
              합계 {formatKrw(row.splitHint.totalKrw)} · 예매 {row.splitHint.order.orderNo} (
              {row.splitHint.order.realName})
            </span>
          </span>
        ) : null}
        {row.matchCandidates.length >= 2 ? (
          <span className="flex flex-col gap-0.5">
            <Badge tone="warning">동일 조건 예매 {row.matchCandidates.length}건</Badge>
            <span className="text-[12px] leading-relaxed text-[#4A4E5A]">
              {row.matchCandidates.map((candidate) => candidate.orderNo).join(' · ')}
            </span>
          </span>
        ) : null}
        {row.matchCandidates.length === 1 ? (
          <span className="text-[12px] leading-relaxed text-[#4A4E5A]">
            동일 금액 예매 {row.matchCandidates[0].orderNo} ({row.matchCandidates[0].realName})
          </span>
        ) : null}
      </div>
    );
  },
};

export const memoColumn: Column<AdminDepositView> = {
  key: 'memo',
  header: '보류·반환 사유',
  render: (row) => {
    const cause = row.order?.holdCause;

    return (
      <div className="flex flex-col gap-1">
        {/* 표준 사유 구분 — 회원 화면의 해결 안내도 같은 기준으로 갈린다 */}
        {cause ? <StatusBadge view={HOLD_CAUSE_VIEW[cause]} /> : null}
        <span className="text-[12px] leading-relaxed text-[#4A4E5A]">
          {row.memo ?? row.order?.holdReason ?? '-'}
        </span>
      </div>
    );
  },
};
