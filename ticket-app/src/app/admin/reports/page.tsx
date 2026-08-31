'use client';

import { useCallback, useMemo } from 'react';

import { useAdminResource, useNow } from '../_components/hooks';
import { useToast } from '../_components/toast';
import { Card, Collapsible, EmptyState, InfoNote, PageHeader } from '../_components/ui';
import { ManualReportForm } from './_components/manual-report-form';
import { ReportCard } from './_components/report-card';
import { adminApi } from '@/lib/admin-client';
import type { AdminReportView, ReportActionType } from '@/lib/admin-types';

export default function AdminReportsPage() {
  const now = useNow();
  const loadReports = useCallback(() => adminApi.reports(), []);
  const { state, reload } = useAdminResource(loadReports);
  const toast = useToast();

  const items: AdminReportView[] = state.status === 'READY' ? state.data.items : [];

  const grouped = useMemo(
    () => ({
      active: items.filter((report) => report.status !== 'CLOSED'),
      pending: items.filter((report) => report.status === 'RECEIVED'),
      closed: items.filter((report) => report.status === 'CLOSED'),
    }),
    [items],
  );

  const handleAct = async (reportId: string, actionType: ReportActionType) => {
    const result = await adminApi.actOnReport(reportId, actionType);
    toast.fromResult(result, `${actionType} 조치를 기록했습니다.`);
    if (result.ok) void reload();
  };

  return (
    <>
      <PageHeader
        title="신고 처리"
        description="부정 거래(암표) 신고를 접수 순서가 아니라 처리 기한이 급한 순서로 처리합니다."
      />

      <InfoNote tone="warning">
        부정판매 게시물은 통보 접수 후 문화체육관광부 고시 기준 10시간 이내 노출 차단 조치가 필요합니다. 아래 타이머는
        접수 시각 + 10시간 기준입니다.
      </InfoNote>

      {state.status !== 'READY' ? (
        <Card>
          <p className="text-[13px] text-[#6B7080]">
            {state.status === 'LOADING' ? '신고 내역을 불러오는 중입니다…' : state.reason}
          </p>
        </Card>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-[15px] font-bold text-[#1B1D22]">
              처리 대기·진행 ({grouped.active.length}건)
              <span className="ml-2 text-[12px] font-medium text-[#6B7080]">
                미조치 {grouped.pending.length}건
              </span>
            </h2>
            {grouped.active.length === 0 ? (
              <EmptyState text="처리할 신고가 없습니다." />
            ) : (
              grouped.active.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  now={now}
                  onAct={(actionType) => void handleAct(report.id, actionType)}
                />
              ))
            )}
          </section>

          <Collapsible summary="외부 통보 수기 등록">
            <ManualReportForm onDone={() => void reload()} />
          </Collapsible>

          <Collapsible summary={`처리 완료(종결) 이력 (${grouped.closed.length}건)`}>
            {grouped.closed.length === 0 ? (
              <EmptyState text="종결된 신고가 없습니다." />
            ) : (
              <div className="flex flex-col gap-3">
                {grouped.closed.map((report) => (
                  <ReportCard key={report.id} report={report} now={now} onAct={() => undefined} readOnly />
                ))}
              </div>
            )}
          </Collapsible>
        </>
      )}
    </>
  );
}
