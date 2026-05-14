'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { mintCampaigns, type MintCampaign } from '@/mock/bive';
import CreateCampaignModal from './CreateCampaignModal';

const TABS = ['Event', 'Ticket', 'Mix', 'Pick'] as const;
const PAGE_SIZE = 20;

export default function MintingPage() {
  const router = useRouter();
  const [tab, setTab] = useState<typeof TABS[number]>('Event');
  const [statusFilter, setStatusFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = mintCampaigns
    .filter((c) => c.type === tab.toUpperCase())
    .filter((c) => (statusFilter ? c.status === statusFilter : true))
    .filter((c) => (keyword ? c.name.toLowerCase().includes(keyword.toLowerCase()) : true));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <PageHeader title="민팅 관리" breadcrumbItems={[{ label: 'BIVE' }, { label: '민팅 관리' }]} />

      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-0">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setPage(1); }}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >{t}</button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="">상태(전체)</option>
            <option value="활성">활성</option>
            <option value="비활성">비활성</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none min-w-[140px]">
            <option>생성일(빠른순)</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex-1" />
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder="캠페인명 입력"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[240px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => { setStatusFilter(''); setKeyword(''); setPage(1); }}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >초기화</button>
        <button
          onClick={() => setCreateOpen(true)}
          className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50"
        >
          <PlusIcon className="w-4 h-4" />캠페인 생성
        </button>
      </div>

      <SimpleTable<MintCampaign>
        columns={[
          { key: 'id', label: 'ID', width: '60px' },
          { key: 'status', label: '상태', width: '80px', render: (r) => (
            <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700">{r.status}</span>
          )},
          { key: 'name', label: '캠페인 명', render: (r) => <span className="text-gray-900">{r.name}</span> },
          { key: 'linkedFeature', label: '연결 기능', width: '140px', render: (r) => <span className="text-indigo-600">{r.linkedFeature}</span> },
          { key: 'registeredBive', label: '등록된 BIVE 수', width: '120px' },
          { key: 'minted', label: '발행 수', width: '90px' },
          { key: 'createdAt', label: '생성일', width: '160px' },
        ]}
        rows={paged}
        emptyMessage={`${tab} 캠페인이 없습니다.`}
        onRowClick={(c) => router.push(`/bive/minting/${c.id}?tab=info`)}
      />

      <SimplePagination page={page} totalPages={totalPages || 1} onChange={setPage} />

      <CreateCampaignModal isOpen={createOpen} onClose={() => setCreateOpen(false)} type={tab.toUpperCase() as 'EVENT' | 'TICKET' | 'MIX' | 'PICK'} />
    </div>
  );
}
