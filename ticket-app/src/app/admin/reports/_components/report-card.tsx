'use client';

import { Button } from '../../_components/form';
import { REPORT_STATUS_VIEW } from '../../_components/labels';
import { SlaCountdown } from '../../_components/sla-countdown';
import { Badge, StatusBadge } from '../../_components/ui';
import type { AdminReportView, ReportActionType } from '@/lib/admin-types';
import { MS_PER_HOUR } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';

/** 처리 기한 잔여 3시간 미만이면 경고 표시 */
const REPORT_WARNING_MS = 3 * MS_PER_HOUR;

const ACTIONS: ReportActionType[] = ['노출 차단', '수사기관 제출', '계정 제재', '티켓 무효화', '종결'];

export function ReportCard({
  report,
  now,
  onAct,
  readOnly = false,
}: {
  report: AdminReportView;
  now: Date;
  onAct: (actionType: ReportActionType) => void;
  readOnly?: boolean;
}) {
  return (
    <article className="rounded-xl border border-[#E3E5EA] bg-white p-5 shadow-[0_1px_2px_rgba(27,29,34,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral">{report.targetType}</Badge>
            <StatusBadge view={REPORT_STATUS_VIEW[report.status]} />
            <Badge tone={report.source === '앱 신고' ? 'accent' : 'warning'}>{report.source}</Badge>
          </div>
          <h3 className="mt-2 text-[15px] font-bold text-[#1B1D22]">{report.reason}</h3>
          <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-[#4A4E5A]">{report.detail}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#6B7080]">
            <span className="tabular-nums">접수 {formatDateTime(report.createdAt)}</span>
            {report.evidenceUrl ? <span className="break-all">증빙 {report.evidenceUrl}</span> : null}
          </div>
        </div>
        <SlaCountdown deadlineAt={report.deadlineAt} now={now} warningMs={REPORT_WARNING_MS} />
      </div>

      {readOnly ? null : (
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[#F0F1F4] pt-4">
          {ACTIONS.map((actionType) => (
            <Button
              key={actionType}
              size="sm"
              variant={actionType === '노출 차단' ? 'primary' : actionType === '종결' ? 'secondary' : 'danger'}
              onClick={() => onAct(actionType)}
            >
              {actionType}
            </Button>
          ))}
        </div>
      )}

      {report.actions.length > 0 ? (
        <ol className="mt-3 flex flex-col gap-1 border-t border-[#F0F1F4] pt-3">
          {report.actions.map((action, index) => (
            <li
              key={`${action.actionType}-${action.actedAt}-${index}`}
              className="flex items-center gap-2 text-[12px]"
            >
              <span className="text-[#3056D3]">●</span>
              <span className="font-semibold text-[#1B1D22]">{action.actionType}</span>
              <span className="tabular-nums text-[#6B7080]">{formatDateTime(action.actedAt)}</span>
              <span className="text-[#6B7080]">{action.adminName}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </article>
  );
}
