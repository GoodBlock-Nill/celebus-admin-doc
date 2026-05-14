'use client';

import { use, useState } from 'react';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { getEditionById, getEditionTokens, type BiveToken } from '@/mock/bive';
import RegisterBiveModal from './RegisterBiveModal';

const PAGE_SIZE = 17;

export default function EditionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const editionId = parseInt(id, 10);
  const edition = getEditionById(editionId);
  const tokens = getEditionTokens(editionId);

  const [statusFilter, setStatusFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [registerOpen, setRegisterOpen] = useState(false);

  if (!edition) {
    return <div className="p-8 text-sm text-gray-500">에디션을 찾을 수 없습니다.</div>;
  }

  const filtered = tokens
    .filter((t) => (statusFilter ? t.status === statusFilter : true))
    .filter((t) => (gradeFilter ? t.grade === gradeFilter : true))
    .filter((t) => (keyword ? t.name.toLowerCase().includes(keyword.toLowerCase()) : true));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title="BIVE 관리"
          breadcrumbItems={[{ label: 'BIVE' }, { label: '에디션 관리', href: '/bive/editions' }, { label: '에디션 BIVE 관리' }]}
        />
        <button
          onClick={() => setRegisterOpen(true)}
          className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50"
        >
          <PlusIcon className="w-4 h-4" />BIVE 등록
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="">상태(전체)</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={gradeFilter}
            onChange={(e) => { setGradeFilter(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="">등급(전체)</option>
            <option value="Event">Event</option>
            <option value="Ticket">Ticket</option>
            <option value="Mix">Mix</option>
            <option value="Pick">Pick</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex-1" />
        <div className="relative">
          <select className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none min-w-[100px]">
            <option>명칭</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder="명칭 입력"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[240px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <SimpleTable<BiveToken>
        columns={[
          { key: 'status', label: '상태', width: '90px', render: (r) => (
            <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-700">
              {r.status}
            </span>
          )},
          { key: 'name', label: '명칭', render: (r) => <span className="font-medium text-gray-900">{r.name}</span> },
          { key: 'artistGroup', label: '아티스트 그룹', width: '110px' },
          { key: 'artist', label: '아티스트', width: '90px' },
          { key: 'grade', label: '등급', width: '80px' },
          { key: 'gradeNumber', label: '등급번호', width: '90px' },
          { key: 'mintEvent', label: '민팅 이벤트', width: '100px' },
          { key: 'mintedCount', label: '발행 수', width: '90px' },
          { key: 'registeredAt', label: '등록일시', width: '110px' },
        ]}
        rows={paged}
      />

      <SimplePagination page={page} totalPages={totalPages || 1} onChange={setPage} />

      <RegisterBiveModal isOpen={registerOpen} onClose={() => setRegisterOpen(false)} />
    </div>
  );
}
