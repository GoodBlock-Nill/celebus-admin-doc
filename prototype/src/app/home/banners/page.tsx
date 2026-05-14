'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import StatCardWithBar from '@/components/clone/StatCardWithBar';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import {
  banners,
  bannerStats,
  getSourceTypeBadge,
  type HomeBanner,
  type BannerStatus,
  type BannerSourceType,
} from '@/mock/home';

const PAGE_SIZE = 10;

const STATUS_BADGE: Record<BannerStatus, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: 'bg-gray-200', text: 'text-gray-700', label: 'DRAFT' },
  ACTIVE: { bg: 'bg-emerald-500', text: 'text-white', label: 'ACTIVE' },
  CLOSED: { bg: 'bg-gray-400', text: 'text-white', label: 'CLOSED' },
};

export default function HomeBannersPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [artistFilter, setArtistFilter] = useState('');
  const [sourceTypeFilter, setSourceTypeFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const filtered = banners
    .filter((b) => (statusFilter ? b.status === statusFilter : true))
    .filter((b) => {
      if (!artistFilter) return true;
      if (artistFilter === 'GLOBAL') return b.artistGroup === null;
      return b.artistGroup === artistFilter;
    })
    .filter((b) => (sourceTypeFilter ? b.sourceType === sourceTypeFilter : true))
    .filter((b) => (keyword ? b.titleKO.toLowerCase().includes(keyword.toLowerCase()) : true));

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader title="배너 관리" breadcrumbItems={[{ label: '홈 운영' }, { label: '배너 관리' }]} />
        <button
          onClick={() => alert('[Mock] 배너 생성 (HOM-101-CREATE)')}
          className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          <PlusIcon className="w-4 h-4" />새 배너 등록
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCardWithBar label="전체 배너" count={bannerStats.total} variant="default" />
        <StatCardWithBar label="ACTIVE" count={bannerStats.active} variant="active" />
        <StatCardWithBar label="DRAFT" count={bannerStats.draft} variant="inactive" />
        <StatCardWithBar label="전역 배너" count={bannerStats.globalCount} variant="default" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">총 노출 (Impression)</div>
          <div className="text-2xl font-bold text-gray-900">{bannerStats.totalImpression.toLocaleString()}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">
            총 클릭 (CTR {((bannerStats.totalClick / bannerStats.totalImpression) * 100).toFixed(2)}%)
          </div>
          <div className="text-2xl font-bold text-indigo-700">{bannerStats.totalClick.toLocaleString()}</div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="">상태(전체)</option>
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="CLOSED">CLOSED</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={artistFilter}
            onChange={(e) => { setArtistFilter(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[160px]"
          >
            <option value="">아티스트(전체)</option>
            <option value="GLOBAL">전역 (NULL)</option>
            <option value="V01D">V01D</option>
            <option value="iKON">iKON</option>
            <option value="CELEBUS">CELEBUS</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={sourceTypeFilter}
            onChange={(e) => { setSourceTypeFilter(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[160px]"
          >
            <option value="">소스 타입(전체)</option>
            <option value="RAFFLE">Raffle</option>
            <option value="SUPPORT_EVENT">응원하기</option>
            <option value="QUEST">Quest</option>
            <option value="BIVE_CAMPAIGN">BIVE</option>
            <option value="INF_NEWS">소식</option>
            <option value="PROMO">프로모션</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex-1" />
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder="타이틀 검색"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[260px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => { setStatusFilter(''); setArtistFilter(''); setSourceTypeFilter(''); setKeyword(''); setPage(1); }}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          초기화
        </button>
      </div>

      <SimpleTable<HomeBanner>
        columns={[
          { key: 'displayOrder', label: '순서', width: '60px', align: 'right', render: (r) => r.displayOrder },
          { key: 'status', label: '상태', width: '90px', render: (r) => {
            const cfg = STATUS_BADGE[r.status];
            return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
          }},
          { key: 'artistGroup', label: '아티스트', width: '110px', render: (r) => {
            if (r.artistGroup === null) {
              return <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600">전역</span>;
            }
            return <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700">{r.artistGroup}</span>;
          }},
          { key: 'sourceType', label: '소스 타입', width: '110px', render: (r) => {
            const cfg = getSourceTypeBadge(r.sourceType as BannerSourceType);
            return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
          }},
          { key: 'titleKO', label: '타이틀(KO)', render: (r) => (
            <div>
              <div className="text-gray-900 font-medium">{r.titleKO}</div>
              <div className="text-xs text-gray-500 mt-0.5">→ {r.sourceRefName}</div>
            </div>
          )},
          { key: 'impressionCount', label: '노출', width: '90px', align: 'right', render: (r) => r.impressionCount.toLocaleString() },
          { key: 'clickCount', label: '클릭(CTR)', width: '110px', align: 'right', render: (r) => (
            <div>
              <div className="text-gray-900 font-medium">{r.clickCount.toLocaleString()}</div>
              <div className="text-xs text-emerald-600">{r.impressionCount > 0 ? ((r.clickCount / r.impressionCount) * 100).toFixed(2) : '0.00'}%</div>
            </div>
          )},
          { key: 'openDt', label: '공개일', width: '140px' },
          { key: 'closeDt', label: '종료일', width: '140px' },
        ]}
        rows={paged}
        emptyMessage="조건에 맞는 배너가 없습니다."
        onRowClick={(b) => router.push(`/home/${b.id}`)}
      />

      <SimplePagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
