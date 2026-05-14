'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import StatCardWithBar from '@/components/clone/StatCardWithBar';
import SimpleTable from '@/components/clone/SimpleTable';
import {
  rftLogs,
  rftStats,
  sourcePolicies,
  getSourceDistribution,
  getUseDistribution,
  type RftLog,
} from '@/mock/rft';

const PERIODS = [
  { key: 'today', label: '오늘' },
  { key: 'week', label: '이번 주' },
  { key: 'month', label: '이번 달' },
  { key: 'year', label: '올해' },
  { key: 'all', label: '전체' },
] as const;

export default function RftCurrentPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<typeof PERIODS[number]['key']>('month');

  const earnDist = getSourceDistribution();
  const useDist = getUseDistribution();
  const recent = rftLogs.slice(0, 10);

  const sourceLabelMap = Object.fromEntries(
    sourcePolicies.map((s) => [s.code, s.nameKO]),
  );
  const earnTotal = Object.values(earnDist).reduce((a, b) => a + b, 0);
  const useTotal = Object.values(useDist).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title="응모권 현황"
          breadcrumbItems={[{ label: '응모권' }, { label: '응모권 현황' }]}
        />
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === p.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCardWithBar label="총 발급" count={rftStats.totalIssued} variant="active" />
        <StatCardWithBar label="총 보유" count={rftStats.totalHeld} variant="default" />
        <StatCardWithBar label="총 사용" count={rftStats.totalUsed} variant="inactive" />
      </div>

      <div className="mb-6">
        {/* 출처별 분포 — 발급 / 사용 명확히 분리 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">출처별 발급 분포</h3>
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />발급(EARN) 5종
            </span>
          </div>
          <div className="space-y-3 mb-5">
            {Object.entries(earnDist).map(([code, value]) => {
              const pct = earnTotal ? (value / earnTotal) * 100 : 0;
              return (
                <button
                  key={code}
                  onClick={() => router.push(`/rft/history?source=${code}`)}
                  className="w-full text-left group"
                >
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <span className="text-gray-700 group-hover:text-emerald-700">{sourceLabelMap[code] ?? code}</span>
                    <span className="text-gray-900 font-semibold">+{value.toLocaleString()}장 <span className="text-gray-400 font-normal text-xs">({pct.toFixed(1)}%)</span></span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 group-hover:bg-emerald-600 transition-colors" style={{ width: `${pct}%` }} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">출처별 사용 분포</h3>
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-rose-50 text-rose-700">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />사용(USE) {Object.keys(useDist).length}종
              </span>
            </div>
            <div className="space-y-3">
              {Object.entries(useDist).map(([code, value]) => {
                const pct = useTotal ? (value / useTotal) * 100 : 0;
                return (
                  <button
                    key={code}
                    onClick={() => router.push(`/rft/history?source=${code}`)}
                    className="w-full text-left group"
                  >
                    <div className="flex items-center justify-between mb-1.5 text-sm">
                      <span className="text-gray-700 group-hover:text-rose-700">{sourceLabelMap[code] ?? code}</span>
                      <span className="text-gray-900 font-semibold">-{value.toLocaleString()}장 <span className="text-gray-400 font-normal text-xs">({pct.toFixed(1)}%)</span></span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 group-hover:bg-rose-600 transition-colors" style={{ width: `${pct}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 최근 변동 (10건) */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">최근 변동</h3>
          <button
            onClick={() => router.push('/rft/history')}
            className="text-sm text-indigo-600 hover:underline"
          >
            더 보기 →
          </button>
        </div>
        <SimpleTable<RftLog>
          columns={[
            { key: 'occurredAt', label: '일시', width: '140px' },
            { key: 'nickname', label: '회원', width: '160px' },
            { key: 'delta', label: '변동', width: '90px', render: (r) => (
              <span className={r.delta > 0 ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
                {r.delta > 0 ? '+' : ''}{r.delta}장
              </span>
            )},
            { key: 'sourceFeature', label: '출처', width: '160px', render: (r) => (
              <span className="text-gray-700">{sourceLabelMap[r.sourceFeature] ?? r.sourceFeature}</span>
            )},
            { key: 'sourceArtistContext', label: '아티스트 컨텍스트', width: '140px', render: (r) => (
              <span className={r.sourceArtistContext ? 'inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700' : 'text-gray-400 text-xs'}>
                {r.sourceArtistContext ?? '전역'}
              </span>
            )},
            { key: 'sourceRefId', label: '참조', render: (r) => <span className="text-gray-500 text-xs">{r.sourceRefId}</span> },
          ]}
          rows={recent}
        />
      </div>

    </div>
  );
}
