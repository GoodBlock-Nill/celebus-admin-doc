'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { MS_PER_HOUR } from '@/lib/constants';
import { formatKrw } from '@/lib/format';
import { useTicketStore } from '@/lib/store';
import { kstParts } from '@/lib/time';
import { useHydrated } from '@/lib/use-hydrated';
import { useNow } from './_components/hooks';
import { resolveSla } from './_components/sla-countdown';
import { Badge, Card, PageHeader } from './_components/ui';
import type { Tone } from './_components/labels';

/** 취소 요청 처리 기한 — 요청 시각 + 24시간 */
const REFUND_SLA_HOURS = 24;

function isSameKstDay(iso: string, now: Date): boolean {
  const target = kstParts(new Date(iso));
  const today = kstParts(now);
  return target.year === today.year && target.month === today.month && target.day === today.day;
}

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

export default function BackofficeDashboardPage() {
  const hydrated = useHydrated();
  const now = useNow();
  const deposits = useTicketStore((state) => state.deposits);
  const orders = useTicketStore((state) => state.orders);
  const reports = useTicketStore((state) => state.reports);

  const summary = useMemo(() => {
    const autoMatched = deposits.filter((item) => item.status === 'AUTO_MATCHED').length;
    const held = deposits.filter((item) => item.status === 'HELD').length;
    const unmatched = deposits.filter((item) => item.status === 'UNMATCHED').length;
    const issuePending = orders.filter((order) => order.status === 'DEPOSIT_CONFIRMED').length;

    const cancelRequested = orders.filter((order) => order.status === 'CANCEL_REQUESTED');
    const refundRemainList = cancelRequested.map((order) =>
      order.cancelRequestedAt
        ? new Date(order.cancelRequestedAt).getTime() + REFUND_SLA_HOURS * MS_PER_HOUR - now.getTime()
        : REFUND_SLA_HOURS * MS_PER_HOUR,
    );
    const refundCaption =
      refundRemainList.length === 0
        ? '취소 요청이 없습니다.'
        : `처리 기한 ${REFUND_SLA_HOURS}시간 · 가장 급한 건 ${
            Math.min(...refundRemainList) <= 0
              ? '기한 초과'
              : `${Math.max(0, Math.floor(Math.min(...refundRemainList) / MS_PER_HOUR))}시간 남음`
          }`;

    const pendingReports = reports.filter((report) => report.status === 'RECEIVED');
    const nearestReport = pendingReports
      .slice()
      .sort((a, b) => new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime())[0];

    // 입금이 확인된 시점부터 판매로 집계한다 (티켓 지급 처리 전 주문 포함)
    const todayPaid = orders.filter(
      (order) =>
        (order.status === 'DEPOSIT_CONFIRMED' || order.status === 'PAID') &&
        isSameKstDay(order.createdAt, now),
    );

    return {
      depositPending: autoMatched + held + unmatched + issuePending,
      autoMatched,
      held,
      unmatched,
      issuePending,
      refundPending: cancelRequested.length,
      refundCaption,
      reportPending: pendingReports.length,
      nearestReport,
      todayQty: todayPaid.reduce((sum, order) => sum + order.qty, 0),
      todayAmount: todayPaid.reduce((sum, order) => sum + order.amountKrw, 0),
    };
  }, [deposits, orders, reports, now]);

  const reportSla = summary.nearestReport
    ? resolveSla(summary.nearestReport.deadlineAt, now, 3 * MS_PER_HOUR)
    : null;

  return (
    <>
      <PageHeader
        title="운영 대시보드"
        description="무통장입금 기반 1차 오픈 운영 큐를 한눈에 확인합니다. 카드를 누르면 해당 처리 화면으로 이동합니다."
      />

      {!hydrated ? (
        <Card>
          <p className="text-[13px] text-[#6B7080]">데모 데이터를 불러오는 중입니다…</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              href="/bo/deposits"
              label="입금 확인 대기"
              value={String(summary.depositPending)}
              unit="건"
              caption={`자동 대조 ${summary.autoMatched}건 · 지급 대기 ${summary.issuePending}건 · 보류 ${summary.held}건 · 미대조 ${summary.unmatched}건`}
              tone={summary.depositPending > 0 ? 'warning' : 'neutral'}
            />
            <StatCard
              href="/bo/refunds"
              label="취소·환불 대기"
              value={String(summary.refundPending)}
              unit="건"
              caption={summary.refundCaption}
              tone={summary.refundPending > 0 ? 'warning' : 'neutral'}
            />
            <StatCard
              href="/bo/reports"
              label="신고 미처리"
              value={String(summary.reportPending)}
              unit="건"
              caption={
                reportSla ? `처리 기한 10시간 · 가장 급한 건 ${reportSla.text}` : '미처리 신고가 없습니다.'
              }
              tone={reportSla ? reportSla.tone : 'neutral'}
            />
            <StatCard
              href="/bo/concerts"
              label="오늘 판매 (입금 확정 기준)"
              value={String(summary.todayQty)}
              unit="매"
              caption={`판매 금액 ${formatKrw(summary.todayAmount)}`}
              tone="accent"
            />
          </div>

          <Card title="운영 처리 순서" description="1차 오픈은 무통장입금 수기 확인 흐름을 전제로 합니다.">
            <ol className="flex flex-col gap-2 text-[13px] leading-relaxed text-[#4A4E5A]">
              <li>① 회원 앱에서 예매가 접수되면 좌석이 선점되고 입금 마감 시각이 부여됩니다.</li>
              <li>② 입금 건이 들어오면 금액·실명 기준으로 자동 대조되고, 운영자가 입금을 확인하면 지급 대기로 넘어갑니다.</li>
              <li>③ 지급 대기 주문은 운영자가 티켓 지급 처리를 해야 실명 티켓이 발급됩니다.</li>
              <li>④ 이름·금액이 어긋난 건은 보류 큐에서 수동 매칭하거나 반환 대상으로 지정합니다.</li>
              <li>⑤ 취소 요청은 24시간 이내 환불 승인, 부정 거래 신고는 10시간 이내 조치가 기준입니다.</li>
            </ol>
          </Card>
        </>
      )}
    </>
  );
}
