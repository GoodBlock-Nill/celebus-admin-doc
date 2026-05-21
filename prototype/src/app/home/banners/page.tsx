'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronRightIcon,
  ChevronUpDownIcon,
  InboxIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import StatCardWithBar from '@/components/clone/StatCardWithBar';
import {
  ACTIVE_ARTISTS,
  getArtistDisplay,
  getSlotKindBadge,
  getSlotKindLabel,
  getSlotsForTab,
  getTabStatusCounts,
  SLOT_KIND_META,
  type ArtistGroup,
  type Slot,
  type SlotKind,
  type SlotTab,
} from '@/mock/home';

type TabId = SlotTab;

interface TabDef {
  id: TabId;
  label: string;
  slotKinds: SlotKind[];
}

const TABS: TabDef[] = [
  { id: 'home', label: '홈', slotKinds: ['MAIN', 'TODAY_TODO'] },
  { id: 'artist', label: '아티스트 메인', slotKinds: ['TOGETHER', 'MISSION'] },
];

function HomeBannersPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('placement') as TabId | null) ?? 'home';
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [artistFilter, setArtistFilter] = useState('');
  const [slotKindFilter, setSlotKindFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  // 통계 카드 클릭 필터 (전체='', 그 외 BannerStatus 값) — [CEB-BO-APP-101] §2-4 정합
  const [statusFilter, setStatusFilter] = useState<'' | 'ACTIVE' | 'DRAFT' | 'CLOSED'>('');

  const currentTab = TABS.find((t) => t.id === activeTab)!;
  const slots = useMemo(() => getSlotsForTab(activeTab), [activeTab]);
  const tabCounts = useMemo(() => getTabStatusCounts(activeTab), [activeTab]);

  // 필터
  const filtered = useMemo(() => {
    const q = keyword.toLowerCase();
    return slots.filter((s) => {
      if (artistFilter) {
        if (artistFilter === 'GLOBAL') {
          if (s.artistGroup !== null) return false;
        } else if (s.artistGroup !== artistFilter) {
          return false;
        }
      }
      if (slotKindFilter && s.slotKind !== slotKindFilter) return false;
      if (q) {
        const label = `${getSlotKindLabel(s.slotKind)} ${getArtistDisplay(s.artistGroup)}`.toLowerCase();
        if (!label.includes(q)) return false;
      }
      // 통계 카드 상태 필터: 해당 상태의 배너가 1건 이상 포함된 슬롯만 통과
      if (statusFilter) {
        const hasStatus = s.banners.some((b) => b.status === statusFilter);
        if (!hasStatus) return false;
      }
      return true;
    });
  }, [slots, artistFilter, slotKindFilter, keyword, statusFilter]);

  const handleTabChange = (id: TabId) => {
    setActiveTab(id);
    setArtistFilter('');
    setSlotKindFilter('');
    setKeyword('');
    setStatusFilter('');
    const url = new URL(window.location.href);
    url.searchParams.set('placement', id);
    window.history.replaceState(null, '', url.toString());
  };

  const resetFilters = () => {
    setArtistFilter('');
    setSlotKindFilter('');
    setKeyword('');
    setStatusFilter('');
  };

  return (
    <div>
      <div className="mb-6">
        <PageHeader title="배너 관리" breadcrumbItems={[{ label: '앱' }, { label: '배너 관리' }]} />
      </div>

      {/* 노출 위치 탭 */}
      <div className="border-b border-gray-200 mb-4">
        <div className="flex gap-1">
          {TABS.map((t) => {
            const active = t.id === activeTab;
            const count = getSlotsForTab(t.id).length;
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
                  active
                    ? 'text-indigo-700 border-indigo-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t.label}
                <span
                  className={`ml-1.5 inline-flex items-center justify-center min-w-[20px] px-1.5 rounded-full text-xs ${
                    active ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 안내 — 슬롯 자동 생성 + 배너 관리 진입 안내 */}
      <div className="mb-4 px-4 py-2.5 rounded-lg text-sm bg-violet-50 border border-violet-100 text-violet-800 flex items-center justify-between">
        <div>
          <span className="font-semibold">
            {currentTab.label} 슬롯 {slots.length}개
          </span>{' '}
          — 슬롯은 위치 × 아티스트 조합으로 자동 생성됩니다. 각 슬롯의 행을 클릭해 배너를 등록·관리해 주세요.
        </div>
      </div>

      {/* 통계 카드 4종 — 슬롯 내 배너 합산. 클릭 시 상태 필터 적용 ([CEB-BO-APP-101] §2-4) */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCardWithBar
          label="전체 배너"
          count={tabCounts.total}
          variant="default"
          onClick={() => setStatusFilter('')}
          active={statusFilter === ''}
        />
        <StatCardWithBar
          label="노출중"
          count={tabCounts.active}
          variant="active"
          onClick={() => setStatusFilter('ACTIVE')}
          active={statusFilter === 'ACTIVE'}
        />
        <StatCardWithBar
          label="임시저장"
          count={tabCounts.draft}
          variant="inactive"
          onClick={() => setStatusFilter('DRAFT')}
          active={statusFilter === 'DRAFT'}
        />
        <StatCardWithBar
          label="노출 종료"
          count={tabCounts.closed}
          variant="default"
          onClick={() => setStatusFilter('CLOSED')}
          active={statusFilter === 'CLOSED'}
        />
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <FilterSelect
          value={artistFilter}
          onChange={(v) => setArtistFilter(v)}
          options={[
            { value: '', label: '아티스트(전체)' },
            ...(activeTab === 'home' ? [{ value: 'GLOBAL', label: '전역' }] : []),
            ...ACTIVE_ARTISTS.map((a) => ({ value: a, label: a })),
          ]}
          minWidth="160px"
        />
        <FilterSelect
          value={slotKindFilter}
          onChange={(v) => setSlotKindFilter(v)}
          options={[
            { value: '', label: '위치(전체)' },
            ...currentTab.slotKinds.map((k) => ({ value: k, label: SLOT_KIND_META[k].label })),
          ]}
          minWidth="150px"
        />
        <div className="flex-1" />
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="아티스트·위치 검색"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[240px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={resetFilters}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          초기화
        </button>
      </div>

      {/* 슬롯 테이블 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full min-w-[960px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-xs font-semibold text-gray-600 whitespace-nowrap">
              <th className="w-32 px-4 py-3 text-left">아티스트</th>
              <th className="w-64 px-4 py-3 text-left">배너 위치</th>
              <th className="px-4 py-3 text-left">배너 수</th>
              <th className="w-40 px-4 py-3 text-left">최근 수정일</th>
              <th className="w-28 px-4 py-3 text-left">최근 수정자</th>
              <th className="w-10 px-2 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <InboxIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">조건에 맞는 슬롯이 없습니다.</p>
                </td>
              </tr>
            ) : (
              filtered.map((s) => <SlotRow key={`${s.slotKind}:${s.artistGroup ?? 'GLOBAL'}`} slot={s} onClick={() => router.push(`/home/banners/slot/${s.slotKind}/${s.artistGroup ?? 'GLOBAL'}`)} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function HomeBannersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">불러오는 중…</div>}>
      <HomeBannersPageInner />
    </Suspense>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  minWidth,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  minWidth: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ minWidth }}
        className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

function SlotRow({ slot, onClick }: { slot: Slot; onClick: () => void }) {
  const kindBadge = getSlotKindBadge(slot.slotKind);
  const artistLabel = getArtistDisplay(slot.artistGroup);
  const isGlobal = slot.artistGroup === null;
  const isCarousel = slot.meta.capacity === 'MULTI';
  return (
    <tr onClick={onClick} className="cursor-pointer hover:bg-gray-50 whitespace-nowrap">
      <td className="px-4 py-3 text-sm">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            isGlobal ? 'bg-gray-100 text-gray-600' : 'bg-indigo-50 text-indigo-700'
          }`}
        >
          {artistLabel}
        </span>
      </td>
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${kindBadge.bg} ${kindBadge.text}`}
          >
            {getSlotKindLabel(slot.slotKind)}
          </span>
          <span className="text-xs text-gray-400">
            {isCarousel ? `캐러셀 · 최대 ${slot.meta.capacityLimit}개` : '단일'}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-900 font-semibold">
            {slot.banners.length}
            <span className="text-gray-400 font-normal">건</span>
          </span>
          {slot.activeCount > 0 && (
            <span className="text-emerald-700">노출중 {slot.activeCount}</span>
          )}
          {slot.draftCount > 0 && (
            <span className="text-gray-500">임시 {slot.draftCount}</span>
          )}
          {slot.banners.length === 0 && (
            <span className="text-gray-400">비어 있음</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-gray-600">{slot.lastUpdatedAt ?? '—'}</td>
      <td className="px-4 py-3 text-xs text-gray-600">{slot.lastUpdatedBy ?? '—'}</td>
      <td className="px-2 py-3 text-right">
        <ChevronRightIcon className="w-4 h-4 text-gray-400" />
      </td>
    </tr>
  );
}
