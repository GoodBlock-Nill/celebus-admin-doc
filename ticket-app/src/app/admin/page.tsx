'use client';

import Link from 'next/link';
import { useCallback } from 'react';

import { useAdminResource, useNow } from './_components/hooks';
import { IntegrityCard } from './_components/integrity-card';
import type { Tone } from './_components/labels';
import { resolveSla } from './_components/sla-countdown';
import { Badge, Card, PageHeader } from './_components/ui';
import { adminApi } from '@/lib/admin-client';
import { MS_PER_HOUR } from '@/lib/constants';
import { formatKrw } from '@/lib/format';

/** 취소 요청 처리 기한 — 요청 시각 + 24시간 */
const REFUND_SLA_HOURS = 24;
/** 신고 처리 기한 잔여 3시간 미만이면 경고 */
const REPORT_WARNING_MS = 3 * MS_PER_HOUR;

function StatCard({
  href,
  label,
  value,
  unit,
  caption,
  tone,
}: {
  href: string;
  label: string;
  value: string;
  unit: string;
  caption: string;
  tone: Tone;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-[#E3E5EA] bg-white p-5 shadow-[0_1px_2px_rgba(27,29,34,0.04)] transition-colors hover:border-[#3056D3]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-[#6B7080]">{label}</span>
        <Badge tone={tone}>바로가기</Badge>
      </div>
      <p className="mt-3 text-[28px] font-bold leading-none tabular-nums text-[#1B1D22]">
        {value}
        <span className="ml-1 text-[14px] font-semibold text-[#6B7080]">{unit}</span>
      </p>
      <p className="mt-2 text-[12px] leading-relaxed text-[#6B7080]">{caption}</p>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const now = useNow();
  const loadSummary = useCallback(() => adminApi.summary(), []);
  const { state } = useAdminResource(loadSummary);

  const guide = (
    <Card title="운영 처리 순서" description="1차 오픈은 무통장입금 수기 확인 흐름을 전제로 합니다.">
      <ol className="flex flex-col gap-2 text-[13px] leading-relaxed text-[#4A4E5A]">
        <li>① 회원 앱에서 예매가 접수되면 좌석이 선점되고 입금 마감 시각이 부여됩니다.</li>
        <li>② 회원이 입금 확인을 요청하면 입금 확인중으로 바뀌고 자동 취소가 보류됩니다. 요청이 없어도 입금이 확인되면 바로 처리할 수 있습니다.</li>
        <li>③ 입금 건이 들어오면 금액·실명 기준으로 자동 대조되고, 운영자가 입금을 확인하면 티켓 지급 대기로 넘어갑니다.</li>
        <li>④ 티켓 지급 대기 주문은 운영자가 티켓 지급 처리를 해야 실명 티켓이 발급됩니다.</li>
        <li>⑤ 이름·금액이 어긋난 건은 보류 큐에서 수동 매칭하거나 반환 대상으로 지정하고, 입금이 확인되지 않은 요청은 미입금 반려로 되돌립니다.</li>
        <li>⑥ 취소 요청은 24시간 이내 환불 승인, 부정 거래 신고는 10시간 이내 조치가 기준입니다.</li>
      </ol>
    </Card>
  );

  if (state.status !== 'READY') {
    return (
      <>
        <PageHeader
          title="운영 대시보드"
          description="무통장입금 기반 1차 오픈 운영 큐를 한눈에 확인합니다. 카드를 누르면 해당 처리 화면으로 이동합니다."
        />
        <Card>
          <p className="text-[13px] text-[#6B7080]">
            {state.status === 'LOADING' ? '운영 현황을 불러오는 중입니다…' : state.reason}
          </p>
        </Card>
      </>
    );
  }

  const summary = state.data.summary;

  const refundCaption = summary.nearestCancelRequestedAt
    ? `처리 기한 ${REFUND_SLA_HOURS}시간 · 가장 급한 건 ${
        resolveSla(
          new Date(new Date(summary.nearestCancelRequestedAt).getTime() + REFUND_SLA_HOURS * MS_PER_HOUR).toISOString(),
          now,
          6 * MS_PER_HOUR,
        ).text
      }`
    : '취소 요청이 없습니다.';

  const reportSla = summary.nearestReportDeadlineAt
    ? resolveSla(summary.nearestReportDeadlineAt, now, REPORT_WARNING_MS)
    : null;

  return (
    <>
      <PageHeader
        title="운영 대시보드"
        description="무통장입금 기반 1차 오픈 운영 큐를 한눈에 확인합니다. 카드를 누르면 해당 처리 화면으로 이동합니다."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          href="/admin/deposits"
          label="입금 확인 대기"
          value={String(summary.depositPending)}
          unit="건"
          caption={`회원 요청 ${summary.depositReported}건 · 자동 대조 ${summary.autoMatched}건 · 티켓 지급 대기 ${summary.issuePending}건 · 보류 ${summary.held}건 · 미대조 ${summary.unmatched}건`}
          tone={summary.depositPending > 0 ? 'warning' : 'neutral'}
        />
        <StatCard
          href="/admin/refunds"
          label="취소·환불 대기"
          value={String(summary.refundPending)}
          unit="건"
          caption={refundCaption}
          tone={summary.refundPending > 0 ? 'warning' : 'neutral'}
        />
        <StatCard
          href="/admin/reports"
          label="신고 미처리"
          value={String(summary.reportPending)}
          unit="건"
          caption={reportSla ? `처리 기한 10시간 · 가장 급한 건 ${reportSla.text}` : '미처리 신고가 없습니다.'}
          tone={reportSla ? reportSla.tone : 'neutral'}
        />
        <StatCard
          href="/admin/concerts"
          label="오늘 판매 (입금 확정 기준)"
          value={String(summary.todayQty)}
          unit="매"
          caption={`판매 금액 ${formatKrw(summary.todayAmountKrw)}`}
          tone="accent"
        />
      </div>

      <IntegrityCard integrity={state.data.integrity} />

      {guide}
    </>
  );
}
