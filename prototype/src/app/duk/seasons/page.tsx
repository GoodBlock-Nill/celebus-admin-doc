'use client';

import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import StatCardWithBar from '@/components/clone/StatCardWithBar';
import { seasons, dukStats, type DukSeasonStatus } from '@/mock/duk';

const STATUS_STYLE: Record<DukSeasonStatus, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: 'bg-gray-200', text: 'text-gray-700', label: 'DRAFT' },
  ACTIVE: { bg: 'bg-emerald-500', text: 'text-white', label: 'ACTIVE' },
  SETTLING: { bg: 'bg-amber-500', text: 'text-white', label: 'SETTLING' },
  CLOSED: { bg: 'bg-gray-400', text: 'text-white', label: 'CLOSED' },
};

export default function DukSeasonsPage() {
  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader title="시즌 관리" breadcrumbItems={[{ label: '덕력' }, { label: '시즌 관리' }]} />
        <button
          onClick={() => alert('[Mock] 시즌 생성 (DUK-101-CREATE)')}
          className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          <PlusIcon className="w-4 h-4" />새 시즌 생성
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCardWithBar label="ACTIVE 시즌 참여" count={dukStats.totalParticipants} variant="active" />
        <StatCardWithBar label="아티스트 수" count={dukStats.artistCount} variant="default" />
        <StatCardWithBar label="활성 한도 정책" count={dukStats.activeLimitProfiles} variant="default" />
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">이번 주 변동(누적)</div>
          <div className={`text-2xl font-bold ${dukStats.weeklyChange >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {dukStats.weeklyChange >= 0 ? '+' : ''}{dukStats.weeklyChange.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
        <h4 className="text-sm font-semibold text-indigo-900 mb-1">덕력 시즌 모델 — 글로벌 시즌 마스터 + 아티스트별 독립 랭킹</h4>
        <p className="text-xs text-indigo-800 leading-relaxed">
          시즌 1개로 <strong>모든 아티스트가 동시 시작·종료</strong>합니다. <code className="px-1 bg-indigo-100 rounded">fan_power_season.artist_group_id = NULL</code> (또는 컬럼 제거 요청 진행 중).
          랭킹·누적은 아티스트별로 분리 산출합니다. APP <code className="px-1 bg-indigo-100 rounded">[CEB-DUK-101]</code> "통합 누적" 정책과 정합 ([CEB-BO-100] §3 결정사항 ⑨, [CEB-BO-100-C] §2.1).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {seasons.map((s) => {
          const sb = STATUS_STYLE[s.status];
          return (
            <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${sb.bg} ${sb.text}`}>{sb.label}</span>
                <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600">글로벌 (NULL)</span>
              </div>

              <h5 className="text-lg font-bold text-gray-900 mb-1">{s.name}</h5>
              <div className="text-xs text-gray-500 mb-4">{s.startDt} ~ {s.endDt}</div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-[11px] text-gray-500 mb-0.5">참여 회원</div>
                  <div className="text-sm font-bold text-gray-900">{s.totalParticipants.toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-[11px] text-gray-500 mb-0.5">랭킹 reload</div>
                  <div className="text-[11px] font-medium text-gray-900 mt-1">{s.rankingReloadAt ?? '미실행'}</div>
                </div>
              </div>

              {s.status === 'ACTIVE' && (
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                  <button
                    onClick={() => alert(`[Mock] 랭킹 reload (Redis 키 재실행) — '${s.name}'`)}
                    className="h-9 px-3 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100"
                  >
                    <ArrowPathIcon className="w-3.5 h-3.5" />랭킹 reload
                  </button>
                  <button
                    onClick={() => alert(`[Mock] 시즌 강제 종료 (DUK-101-MD-CLOSE) — '${s.name}'`)}
                    className="h-9 px-3 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100"
                  >
                    강제 종료
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
