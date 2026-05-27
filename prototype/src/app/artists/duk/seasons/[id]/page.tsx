'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import { toast } from '@/components/ui/Toast';
import SeasonFormModal from '../../_components/SeasonFormModal';
import SeasonCloseModal from '../../_components/SeasonCloseModal';
import {
  dukSeasons as initialSeasons,
  getMonthlyRewards,
  getSettledMonthCount,
  type DukSeason,
  type DukSeasonStatus,
} from '@/mock/duk';
import MonthRewardForm, { type LockReason } from './_components/MonthRewardForm';
import HistoryTab from './_components/HistoryTab';

type DetailTab = 'setting' | 'history';

// [CEB-BO-ART-401] v1.6 §2-1-E 시즌 상세 페이지
// 라우트: /artists/duk/seasons/{id}
// 상단 액션: [수정] (예정·진행중) · [종료] (진행중) · [목록으로]
// 월별 보상 12 섹션 — 1구간 = 복수 상품 nested + 5종 분기

const STATUS_BADGE: Record<DukSeasonStatus, string> = {
  예정: 'bg-gray-100 text-gray-700',
  진행중: 'bg-emerald-100 text-emerald-700',
  종료: 'bg-gray-900 text-white',
};

export default function SeasonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const seasonId = Number(id);

  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab: DetailTab = searchParams.get('tab') === 'history' ? 'history' : 'setting';
  const changeTab = (next: DetailTab) => {
    const next_params = new URLSearchParams(searchParams.toString());
    next_params.set('tab', next);
    router.replace(`?${next_params.toString()}`, { scroll: false });
  };

  const [seasons, setSeasons] = useState<DukSeason[]>(initialSeasons);
  const [editOpen, setEditOpen] = useState(false);
  const [closeTarget, setCloseTarget] = useState<DukSeason | null>(null);

  const season = seasons.find((s) => s.id === seasonId);

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
  const settledMonths = months.filter((m) => m.isLocked);
  const firstSettled = settledMonths[0]?.yearMonth;
  const lastSettled = settledMonths[settledMonths.length - 1]?.yearMonth;

  // 이번 달 yearMonth (현재 시각 기준)
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const currentYearMonth = `${now.getFullYear()}.${pad(now.getMonth() + 1)}`;

  // 시즌 상태 × 월 시점 × 정산 매트릭스로 잠금 사유 결정 (DETAIL §2.5)
  const monthPosition = (ym: string): 'past' | 'current' | 'future' => {
    if (ym < currentYearMonth) return 'past';
    if (ym > currentYearMonth) return 'future';
    return 'current';
  };

  const resolveLockReason = (ym: string, isSettled: boolean): LockReason => {
    if (isSettled) return 'settled';
    if (season.status === '종료') return 'season-ended';
    if (season.status === '진행중' && monthPosition(ym) === 'past') return 'past-month';
    return null;
  };

  // 자동 펼침 정책 (DETAIL §2.4) — 항상 1개월만 펼침
  // - 예정: 시즌 첫 월
  // - 진행중: 이번 달 (시즌 범위 안일 때)
  // - 종료: 정산 완료 마지막 월 (없으면 시즌 첫 월)
  const firstMonth = months[0]?.yearMonth;
  const expandedMonth: string | undefined =
    season.status === '예정'
      ? firstMonth
      : season.status === '진행중'
        ? months.find((m) => m.yearMonth === currentYearMonth)?.yearMonth ?? firstMonth
        : lastSettled ?? firstMonth;

  const handleEdit = (data: {
    artistGroupId: number;
    name: string;
    startAt: string;
    endAt: string;
  }) => {
    setSeasons((prev) =>
      prev.map((s) =>
        s.id === seasonId
          ? { ...s, name: data.name, startAt: data.startAt, endAt: data.endAt }
          : s,
      ),
    );
    toast.success('시즌이 저장되었습니다.');
    setEditOpen(false);
  };

  const handleClose = (target: DukSeason) => {
    setSeasons((prev) => prev.map((s) => (s.id === target.id ? { ...s, status: '종료' } : s)));
    toast.success('시즌이 종료되었습니다.');
    setCloseTarget(null);
  };

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
          <>
            {season.status !== '종료' && (
              <button
                onClick={() => setEditOpen(true)}
                className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                수정
              </button>
            )}
            {season.status === '진행중' && (
              <button
                onClick={() => setCloseTarget(season)}
                className="h-10 px-4 text-sm font-medium text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50"
              >
                종료
              </button>
            )}
            <Link
              href="/artists/duk?tab=season"
              className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              목록으로
            </Link>
          </>
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
                : `${settledCount}개월 (${firstSettled}~${lastSettled})`}
            </dd>
          </div>
        </dl>
      </section>

      {/* 탭 메뉴 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1" aria-label="시즌 상세 탭">
          {(
            [
              ['setting', '월별 보상 설정'],
              ['history', '월별 보상 내역'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => changeTab(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === key
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              aria-current={activeTab === key ? 'page' : undefined}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'setting' ? (
        /* 월별 보상 12 섹션 */
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">월별 보상 설정</h2>
          <p className="text-sm text-gray-500 mb-4">
            시즌(1년) 내 매월 별도 보상을 설정합니다. 편집은 예정 시즌의 모든 월 또는 진행중 시즌의 이번 달·미래 월에서만 가능하며, 진행중 시즌의 지난 월·정산 완료 월·종료 시즌의 모든 월은 잠금 상태로 조회만 가능합니다. 1구간에 상품 N개(배송·현장·BIVE·응모권·덕력 5종)를 함께 지급할 수 있습니다.
          </p>
          <div className="space-y-3">
            {months.map((m) => (
              <MonthRewardForm
                key={m.yearMonth}
                yearMonth={m.yearMonth}
                initialTiers={m.tiers}
                lockReason={resolveLockReason(m.yearMonth, m.isLocked)}
                settledAt={m.settledAt}
                defaultExpanded={m.yearMonth === expandedMonth}
              />
            ))}
          </div>
        </section>
      ) : (
        <HistoryTab seasonId={seasonId} seasonName={season.name} groupName={season.artistGroupName} />
      )}

      <SeasonFormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        mode="edit"
        initial={season}
        existingSeasons={seasons}
        onSubmit={handleEdit}
      />

      <SeasonCloseModal
        target={closeTarget}
        onClose={() => setCloseTarget(null)}
        onConfirm={handleClose}
      />
    </div>
  );
}
