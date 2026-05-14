'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import StatCardWithBar from '@/components/clone/StatCardWithBar';
import { getSeasonById, rewards, type SeasonStatus, type JobStatus, type RewardType, type DistributionType } from '@/mock/evt';

const STATUS_STYLE: Record<SeasonStatus, string> = {
  DRAFT: 'bg-gray-200 text-gray-700',
  ACTIVE: 'bg-emerald-500 text-white',
  SETTLING: 'bg-amber-500 text-white',
  CLOSED: 'bg-gray-400 text-white',
};

const JOB_STYLE: Record<JobStatus, string> = {
  READY: 'bg-gray-100 text-gray-600',
  PROCESSING: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-rose-100 text-rose-700',
};

const REWARD_TYPE_LABEL: Record<RewardType, string> = {
  EXCLUSIVE_CONTENT: '독점 콘텐츠',
  DIGITAL: '디지털',
  DOWNLOAD: '다운로드',
  GOODS: '실물 굿즈',
  EVENT: '이벤트',
};

const DIST_BADGE: Record<DistributionType, { bg: string; text: string; label: string }> = {
  ALL: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '전원 지급' },
  LOTTERY: { bg: 'bg-violet-100', text: 'text-violet-700', label: '추첨' },
};

export default function EvtSeasonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const season = getSeasonById(parseInt(id, 10));
  const router = useRouter();

  if (!season) return <div className="p-8 text-sm text-gray-500">시즌을 찾을 수 없습니다.</div>;

  const seasonRewards = rewards.filter((r) => r.artistGroup === season.artistGroup);

  return (
    <div>
      <PageHeader
        title=""
        breadcrumbItems={[
          { label: '팬덤 레벨', href: '/evt/seasons' },
          { label: '시즌 관리', href: '/evt/seasons' },
          { label: season.seasonName },
        ]}
      />

      <div className="flex items-start justify-between -mt-2 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-[24px] font-bold text-gray-900 max-w-[640px]">{season.seasonName}</h1>
            <p className="text-sm text-gray-500 mt-1">{season.startDt} ~ {season.endDt}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${STATUS_STYLE[season.status]}`}>
            {season.status}
          </span>
          {season.status === 'ACTIVE' && (
            <button
              onClick={() => alert(`[Mock] 시즌 강제 종료 (EVT-201-MD-CLOSE) — '${season.seasonName}'`)}
              className="h-10 px-4 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100"
            >
              강제 종료
            </button>
          )}
          {season.status === 'CLOSED' && season.rewardJobStatus === 'FAILED' && (
            <button
              onClick={() => alert(`[Mock] 보상 작업 재실행 (EVT-201-MD-RETRY)`)}
              className="h-10 px-4 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-1.5"
            >
              <ArrowPathIcon className="w-4 h-4" />보상 작업 재실행
            </button>
          )}
        </div>
      </div>

      {/* 섹션 1 — 시즌 통계 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCardWithBar label="참여 회원" count={season.memberCount} variant="active" />
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">평균 레벨</div>
          <div className="text-2xl font-bold text-gray-900">{season.avgLevel.toFixed(1)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">최고 레벨</div>
          <div className="text-2xl font-bold text-indigo-700">Lv.{season.maxLevel}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">시즌 기수</div>
          <div className="text-2xl font-bold text-gray-900">{season.seasonYear}</div>
        </div>
      </div>

      {/* 섹션 2 — 작업 큐 상태 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">정산 작업 큐 상태</h4>
        <div className="grid grid-cols-2 gap-5">
          <JobCard
            title="레벨업 작업 (fandom_level_up_job)"
            description="시즌 종료 시 회원별 최종 레벨 산출 + 레벨업 알림 발송"
            status={season.levelUpJobStatus}
          />
          <JobCard
            title="보상 작업 (fandom_level_reward_job)"
            description="레벨별 보상(EXCLUSIVE_CONTENT/DIGITAL/GOODS) 지급 + 추첨 처리"
            status={season.rewardJobStatus}
          />
        </div>
      </div>

      {/* 섹션 3 — 보상 정책 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-900">시즌 보상 정책 ({seasonRewards.length}건)</h4>
          <button
            onClick={() => alert(`[Mock] 보상 추가 (EVT-301-CREATE)`)}
            className="h-9 px-4 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100"
          >
            + 보상 추가
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {seasonRewards.map((r) => {
            const d = DIST_BADGE[r.distributionType];
            return (
              <div key={r.id} className="px-5 py-4 flex items-center gap-4">
                <div className="w-16 text-center">
                  <div className="text-xs text-gray-500">레벨</div>
                  <div className="text-lg font-bold text-indigo-700">{r.level}</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">{r.titleKO}</span>
                    <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-medium ${d.bg} ${d.text}`}>
                      {d.label}
                    </span>
                    <span className="inline-flex rounded px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600">
                      {REWARD_TYPE_LABEL[r.rewardType]}
                    </span>
                    {!r.active && (
                      <span className="inline-flex rounded px-2 py-0.5 text-[10px] font-medium bg-gray-200 text-gray-500">
                        비활성
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600">{r.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">수령 인원</div>
                  <div className="text-sm font-bold text-emerald-600 mt-0.5">{r.recipientCount}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function JobCard({ title, description, status }: { title: string; description: string; status: JobStatus }) {
  return (
    <div className="border border-gray-100 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-900">{title}</span>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${JOB_STYLE[status]}`}>
          {status}
        </span>
      </div>
      <p className="text-[11px] text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
