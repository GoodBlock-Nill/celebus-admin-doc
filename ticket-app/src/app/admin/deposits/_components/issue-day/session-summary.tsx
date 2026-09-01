'use client';

import { Badge } from '../../../_components/ui';
import { ddayView } from './d-day';
import type { AdminIssueSessionView, SessionIssueResultItem } from '@/lib/admin-types';
import { formatDateTimeWithWeekday } from '@/lib/format';

/** 선택한 회차 요약 — 공연일시·D-day·지급 대상 */
export function SessionSummary({
  session,
  now,
}: {
  session: AdminIssueSessionView;
  now: Date;
}) {
  const dday = ddayView(session.startAt, now);

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-[#E3E5EA] bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[14px] font-bold text-[#1B1D22]">{session.sessionName}</span>
        <Badge tone={dday.tone}>{dday.label}</Badge>
        <span className="text-[12px] text-[#6B7080]">{session.concertTitle}</span>
      </div>
      <p className="text-[12.5px] text-[#4A4E5A]">
        공연 {formatDateTimeWithWeekday(session.startAt)}
      </p>
      <p className="text-[13px] font-semibold text-[#1B1D22]">
        지급 대상 <span className="tabular-nums">{session.pendingOrders}</span>건 · 매수 합계{' '}
        <span className="tabular-nums">{session.pendingQty}</span>매
      </p>
    </div>
  );
}

/** 일괄 지급 결과 — 실패한 건이 있으면 사유까지 건별로 보여 준다 */
export function IssueResultList({ results }: { results: SessionIssueResultItem[] }) {
  if (results.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-[#E3E5EA] bg-[#FAFBFC] px-3 py-2.5">
      <p className="text-[12px] font-bold text-[#4A4E5A]">건별 처리 결과</p>
      <ul className="flex flex-col gap-1">
        {results.map((result) => (
          <li key={result.order_id} className="flex flex-wrap items-center gap-2 text-[12px]">
            <Badge tone={result.ok ? 'success' : 'danger'}>{result.ok ? '지급' : '실패'}</Badge>
            <span className="tabular-nums font-semibold text-[#1B1D22]">{result.order_no}</span>
            <span className="text-[#4A4E5A]">{result.qty}매</span>
            {result.reason ? <span className="text-[#C2402A]">{result.reason}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
