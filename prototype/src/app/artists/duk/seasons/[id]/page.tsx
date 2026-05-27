'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import {
  dukSeasons,
  getMonthlyRewards,
  getSettledMonthCount,
  type DukSeasonStatus,
} from '@/mock/duk';
import MonthRewardForm from './_components/MonthRewardForm';

// [CEB-BO-ART-401] v1.5 §2-1-E 시즌 상세 페이지
// 라우트: /artists/duk/seasons/{id}
// 시즌 정보 카드 + 월별 보상 12 섹션

const STATUS_BADGE: Record<DukSeasonStatus, string> = {
  예정: 'bg-gray-100 text-gray-700',
  진행중: 'bg-emerald-100 text-emerald-700',
  종료: 'bg-gray-900 text-white',
};

export default function SeasonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const seasonId = Number(id);
  const season = dukSeasons.find((s) => s.id === seasonId);

  if (!season) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-6 py-12 text-center">
        <p className="text-sm text-gray-500">존재하지 않는 시즌입니다.</p>
        <Link
          href="/artists/duk?tab=season"
          className="mt-4 inline-block h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          목록으로
        </Link>
      </div>
    );
  }

  const months = getMonthlyRewards(seasonId);
  const settledCount = getSettledMonthCount(seasonId);
  const firstMonth = months[0]?.yearMonth;
  const lastSettled = [...months].reverse().find((m) => m.isLocked)?.yearMonth;

  return (
    <div>
      <PageHeader
        title={`${season.artistGroupName} — ${season.name}`}
        breadcrumbItems={[
          { label: '아티스트' },
          { label: '덕력관리', href: '/artists/duk' },
          { label: '랭킹 시즌 설정', href: '/artists/duk?tab=season' },
          { label: season.name },
        ]}
        actions={
          <Link
            href="/artists/duk?tab=season"
            className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            목록으로
          </Link>
        }
      />

      {/* 시즌 정보 카드 */}
      <section className="bg-white border border-gray-100 rounded-xl px-6 py-5 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">시즌 정보</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div className="flex">
            <dt className="w-24 text-gray-500">그룹</dt>
            <dd className="flex-1 font-medium text-gray-900">{season.artistGroupName}</dd>
          </div>
          <div className="flex">
            <dt className="w-24 text-gray-500">시즌명</dt>
            <dd className="flex-1 font-medium text-gray-900">{season.name}</dd>
          </div>
          <div className="flex">
            <dt className="w-24 text-gray-500">기간</dt>
            <dd className="flex-1 text-gray-800">
              {season.startAt} ~ {season.endAt}
            </dd>
          </div>
          <div className="flex items-center">
            <dt className="w-24 text-gray-500">상태</dt>
            <dd className="flex-1">
              <span
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${STATUS_BADGE[season.status]}`}
              >
                {season.status}
              </span>
            </dd>
          </div>
          <div className="flex">
            <dt className="w-24 text-gray-500">정산 완료</dt>
            <dd className="flex-1 text-gray-800">
              {settledCount === 0
                ? '0개월'
                : `${settledCount}개월 (${firstMonth}~${lastSettled})`}
            </dd>
          </div>
        </dl>
      </section>

      {/* 월별 보상 12 섹션 */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-3">월별 보상 설정</h2>
        <p className="text-sm text-gray-500 mb-4">
          시즌(1년) 내 매월 별도 보상을 설정합니다. 정산 완료된 월은 잠금되며, 미정산 월은 구간을 자유롭게 추가·수정·삭제할 수 있습니다.
        </p>
        <div className="space-y-3">
          {months.map((m) => (
            <MonthRewardForm
              key={m.yearMonth}
              yearMonth={m.yearMonth}
              initialTiers={m.tiers}
              isLocked={m.isLocked}
              settledAt={m.settledAt}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
