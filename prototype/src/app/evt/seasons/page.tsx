'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import PageHeader from '@/components/layout/PageHeader';
import StatCardWithBar from '@/components/clone/StatCardWithBar';
import { seasons, seasonStats, type SeasonStatus, type JobStatus } from '@/mock/evt';

const STATUS_BADGE: Record<SeasonStatus, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: 'bg-gray-200', text: 'text-gray-700', label: 'DRAFT' },
  ACTIVE: { bg: 'bg-emerald-500', text: 'text-white', label: 'ACTIVE' },
  SETTLING: { bg: 'bg-amber-500', text: 'text-white', label: 'SETTLING' },
  CLOSED: { bg: 'bg-gray-400', text: 'text-white', label: 'CLOSED' },
};

const JOB_BADGE: Record<JobStatus, { bg: string; text: string; label: string }> = {
  READY: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'READY' },
  PROCESSING: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'PROCESSING' },
  COMPLETED: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'COMPLETED' },
  FAILED: { bg: 'bg-rose-100', text: 'text-rose-700', label: 'FAILED' },
};

export default function EvtSeasonsPage() {
  const router = useRouter();
  const [artistFilter, setArtistFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  const filtered = seasons
    .filter((s) => (artistFilter ? s.artistGroup === artistFilter : true))
    .filter((s) => (yearFilter ? s.seasonYear === parseInt(yearFilter, 10) : true));

  return (
    <div>
      <PageHeader title="시즌 관리" breadcrumbItems={[{ label: '팬덤 레벨' }, { label: '시즌 관리' }]} />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCardWithBar label="ACTIVE 시즌" count={seasonStats.active} variant="active" />
        <StatCardWithBar label="SETTLING" count={seasonStats.settling} variant="pending" />
        <StatCardWithBar label="CLOSED" count={seasonStats.closed} variant="inactive" />
        <StatCardWithBar label="활성 시즌 회원" count={seasonStats.totalMembers} variant="default" />
      </div>

      {/* 시즌 라이프사이클 워크플로우 안내 */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
        <h4 className="text-sm font-semibold text-indigo-900 mb-2">시즌 라이프사이클 (연 1회 · 1.1 ~ 12.31) <span className="ml-2 text-xs text-indigo-700">🔴 Critical</span></h4>
        <div className="grid grid-cols-4 gap-2 text-xs">
          <LifecycleStep label="01.01 00:00" detail="신규 시즌 자동 시작" color="emerald" />
          <LifecycleStep label="12.31 23:59:59" detail="자동 종료 → SETTLING" color="amber" />
          <LifecycleStep label="정산 중" detail="레벨업 / 보상 작업 큐 실행" color="orange" />
          <LifecycleStep label="정산 완료" detail="CLOSED + 회원 레벨 리셋" color="gray" />
        </div>
        <p className="text-[11px] text-indigo-700 mt-3">
          시즌명 권장 패턴: <code className="px-1 bg-indigo-100 rounded">{'{아티스트} 팬덤 N기 (YYYY)'}</code> (예: V01D 팬덤 2기 (2026))
        </p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={artistFilter}
            onChange={(e) => setArtistFilter(e.target.value)}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[160px]"
          >
            <option value="">아티스트(전체)</option>
            <option value="V01D">V01D</option>
            <option value="iKON">iKON</option>
            <option value="CELEBUS">CELEBUS</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="">시즌 연도</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex-1" />
        <button
          onClick={() => { setArtistFilter(''); setYearFilter(''); }}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          초기화
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((s) => {
          const sb = STATUS_BADGE[s.status];
          const lb = JOB_BADGE[s.levelUpJobStatus];
          const rb = JOB_BADGE[s.rewardJobStatus];
          return (
            <button
              key={s.id}
              onClick={() => router.push(`/evt/seasons/${s.id}`)}
              className="text-left bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${sb.bg} ${sb.text}`}>{sb.label}</span>
                  <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700">{s.artistGroup}</span>
                </div>
                <span className="text-xs text-gray-400 font-medium">{s.seasonYear}</span>
              </div>

              <h5 className="text-base font-bold text-gray-900 mb-2">{s.seasonName}</h5>
              <div className="text-xs text-gray-500 mb-4">{s.startDt} ~ {s.endDt}</div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <Stat label="참여 회원" value={s.memberCount.toLocaleString()} />
                <Stat label="평균 레벨" value={s.avgLevel.toFixed(1)} />
                <Stat label="최고 레벨" value={`Lv.${s.maxLevel}`} />
              </div>

              <div className="border-t border-gray-100 pt-3 flex items-center gap-2 text-[11px]">
                <span className="text-gray-500">레벨업 큐</span>
                <span className={`inline-flex rounded px-1.5 py-0.5 font-medium ${lb.bg} ${lb.text}`}>{lb.label}</span>
                <span className="text-gray-300 mx-1">·</span>
                <span className="text-gray-500">보상 큐</span>
                <span className={`inline-flex rounded px-1.5 py-0.5 font-medium ${rb.bg} ${rb.text}`}>{rb.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2">
      <div className="text-[10px] text-gray-500 mb-0.5">{label}</div>
      <div className="text-sm font-bold text-gray-900">{value}</div>
    </div>
  );
}

function LifecycleStep({ label, detail, color }: { label: string; detail: string; color: 'emerald' | 'amber' | 'orange' | 'gray' }) {
  const bg = {
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    orange: 'bg-orange-100 text-orange-700',
    gray: 'bg-gray-100 text-gray-700',
  }[color];
  return (
    <div className={`rounded-lg p-2 ${bg}`}>
      <div className="font-bold text-[11px] mb-0.5">{label}</div>
      <div className="text-[10px] leading-tight">{detail}</div>
    </div>
  );
}
