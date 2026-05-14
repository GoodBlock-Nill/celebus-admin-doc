'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { PlusIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { editions, type Edition } from '@/mock/bive';
import CreateEditionModal from './CreateEditionModal';

export default function EditionsPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = editions.filter((e) => (keyword ? e.nameKR.toLowerCase().includes(keyword.toLowerCase()) : true));

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader title="에디션 관리" breadcrumbItems={[{ label: 'BIVE' }, { label: '에디션 관리' }]} />
        <button
          onClick={() => setCreateOpen(true)}
          className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50"
        >
          <PlusIcon className="w-4 h-4" />에디션 생성
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <select className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[120px]">
            <option>최신순</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex-1" />
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder="에디션 명 입력"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[260px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => { setKeyword(''); setPage(1); }}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >초기화</button>
      </div>

      <SimpleTable<Edition>
        columns={[
          { key: 'id', label: 'ID', width: '60px', render: (r) => <span className="font-medium">{r.id}</span> },
          { key: 'nameKR', label: '에디션명(KR)', render: (r) => <span className="font-medium text-gray-900">{r.nameKR}</span> },
          { key: 'registeredBive', label: '등록된 BIVE', width: '120px' },
          { key: 'totalMinted', label: '총 발행', width: '100px', render: (r) => r.totalMinted.toLocaleString() },
          { key: 'createdAt', label: '생성일시', width: '160px' },
          { key: 'createdBy', label: '생성 관리자', width: '120px' },
          { key: 'manage', label: '관리', width: '70px', render: () => (
            <button className="text-gray-400 hover:text-gray-600" onClick={(e) => e.stopPropagation()}>
              <Cog6ToothIcon className="w-5 h-5" />
            </button>
          ) },
        ]}
        rows={filtered}
        emptyMessage="등록된 에디션이 없습니다."
        onRowClick={(e) => router.push(`/bive/editions/${e.id}`)}
      />

      <SimplePagination page={page} totalPages={1} onChange={setPage} />

      <CreateEditionModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
