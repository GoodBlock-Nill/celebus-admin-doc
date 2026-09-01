'use client';

import { useEffect, useState } from 'react';

import { ConfirmDialog } from '../../../_components/confirm-dialog';
import { Button, Select } from '../../../_components/form';
import { useConfirm, useNow } from '../../../_components/hooks';
import { useToast } from '../../../_components/toast';
import { Card, EmptyState, InfoNote } from '../../../_components/ui';
import { RecentIssuedList } from '../recent-issued-list';
import { IMMINENT_DAY_DIFF, ddayView } from './d-day';
import { IssueResultList, SessionSummary } from './session-summary';
import { adminApi } from '@/lib/admin-client';
import type {
  AdminIssueSessionView,
  AdminIssuedOrderView,
  SessionIssueResultItem,
} from '@/lib/admin-types';
import { MS_PER_MINUTE } from '@/lib/constants';

/** 회차 선택지 표기 — 공연·회차·D-day·지급 대상 */
function optionLabel(session: AdminIssueSessionView, now: Date): string {
  const dday = ddayView(session.startAt, now);
  return `${dday.label} · ${session.concertTitle} ${session.sessionName} — 대상 ${session.pendingOrders}건 ${session.pendingQty}매`;
}

/**
 * 구획 2 — 공연 당일 지급 (재설계서 D-4).
 * 회차를 고르고 지급 대상을 확인한 뒤 한 번에 지급한다. 공연이 임박했는데 남은 지급 대상이
 * 있으면 위에 경고로 먼저 알린다.
 */
export function IssueDaySection({
  sessions,
  recentIssued,
  onRefresh,
}: {
  sessions: AdminIssueSessionView[];
  recentIssued: AdminIssuedOrderView[];
  onRefresh: () => void;
}) {
  const now = useNow(MS_PER_MINUTE);
  const toast = useToast();
  const confirm = useConfirm();

  const [sessionId, setSessionId] = useState('');
  const [results, setResults] = useState<SessionIssueResultItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 목록이 갱신되면 선택이 사라질 수 있어 첫 회차로 되돌린다.
  useEffect(() => {
    setSessionId((current) =>
      sessions.some((session) => session.sessionId === current) ? current : (sessions[0]?.sessionId ?? ''),
    );
  }, [sessions]);

  const selected = sessions.find((session) => session.sessionId === sessionId) ?? null;
  const imminent = sessions.filter((session) => {
    const diff = ddayView(session.startAt, now).diff;
    return diff !== null && diff <= IMMINENT_DAY_DIFF;
  });

  const issue = async (session: AdminIssueSessionView) => {
    setSubmitting(true);
    const result = await adminApi.issueSessionTickets(session.sessionId);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.reason);
      return;
    }

    const failed = result.data.failed_orders ?? 0;
    setResults(result.data.results ?? []);
    const message = `${session.sessionName} 일괄 지급 — ${result.data.issued_orders ?? 0}건 ${
      result.data.issued_qty ?? 0
    }매 지급${failed > 0 ? ` · 실패 ${failed}건` : ''}`;
    if (failed > 0) toast.info(message);
    else toast.success(message);
    onRefresh();
  };

  const askIssue = (session: AdminIssueSessionView) =>
    confirm.ask({
      title: '이 회차를 일괄 지급할까요?',
      message: `${session.concertTitle} ${session.sessionName}의 지급 대상 ${session.pendingOrders}건(${session.pendingQty}매)에 실명 티켓을 발급합니다. 발급된 티켓은 회원 예매내역·CELEBUS 앱에 즉시 반영됩니다.`,
      confirmLabel: `${session.pendingOrders}건 일괄 지급`,
      confirmVariant: 'primary',
      onConfirm: () => void issue(session),
    });

  return (
    <Card
      title="② 공연 당일 지급"
      description="회차를 골라 티켓 지급 대기 예매를 한 번에 지급합니다. 지급은 공연 당일 발권 일정에 맞추는 것이 원칙입니다."
    >
      <div className="flex flex-col gap-3">
        {imminent.length > 0 ? (
          <InfoNote tone="danger">
            공연이 임박했는데 지급이 남은 회차가 있습니다 —{' '}
            {imminent
              .map(
                (session) =>
                  `${session.sessionName} ${ddayView(session.startAt, now).label} ${session.pendingOrders}건`,
              )
              .join(' · ')}
          </InfoNote>
        ) : null}

        {sessions.length === 0 ? (
          <EmptyState text="티켓 지급을 기다리는 회차가 없습니다." />
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex min-w-[380px] flex-1 flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-[#4A4E5A]">회차 선택</span>
                <Select value={sessionId} onChange={(event) => setSessionId(event.target.value)}>
                  {sessions.map((session) => (
                    <option key={session.sessionId} value={session.sessionId}>
                      {optionLabel(session, now)}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                variant="primary"
                disabled={!selected || submitting}
                onClick={() => selected && askIssue(selected)}
              >
                {submitting ? '지급 중…' : '일괄 지급'}
              </Button>
            </div>

            {selected ? <SessionSummary session={selected} now={now} /> : null}
          </>
        )}

        <IssueResultList results={results} />
        <RecentIssuedList rows={recentIssued} onDone={onRefresh} />
        <ConfirmDialog request={confirm.request} onClose={confirm.close} />
      </div>
    </Card>
  );
}
