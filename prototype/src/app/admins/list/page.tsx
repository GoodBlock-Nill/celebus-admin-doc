'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import PageHeader from '@/components/layout/PageHeader';
import StatCardWithBar from '@/components/clone/StatCardWithBar';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { admins, adminStats, type Admin, type AdminStatus } from '@/mock/admins';
import InviteAdminModal from '../InviteAdminModal';

const PAGE_SIZE = 10;

const STATUS_BADGE: Record<AdminStatus, { bg: string; text: string }> = {
  Active: { bg: 'bg-emerald-500', text: 'text-white' },
  Pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  Locked: { bg: 'bg-red-100', text: 'text-red-700' },
  Inactive: { bg: 'bg-gray-200', text: 'text-gray-700' },
};

export default function AdminsListPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);

  const filtered = admins
    .filter((a) => (statusFilter ? a.status === statusFilter : true))
    .filter((a) => (keyword ? a.name.toLowerCase().includes(keyword.toLowerCase()) || a.email.toLowerCase().includes(keyword.toLowerCase()) : true));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <PageHeader title="관리자현황" breadcrumbItems={[{ label: '관리자' }, { label: '관리자 리스트' }]} />

      <div className="grid grid-cols-5 gap-4 mb-6">
        <StatCardWithBar label="전체" count={adminStats.total} variant="default" />
        <StatCardWithBar label="Active" count={adminStats.active} variant="active" />
        <StatCardWithBar label="Pending" count={adminStats.pending} variant="pending" />
        <StatCardWithBar label="Locked" count={adminStats.locked} variant="locked" />
        <StatCardWithBar label="Inactive" count={adminStats.inactive} variant="inactive" />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-gray-500">상태 필터</span>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[120px]"
          >
            <option value="">전체</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Locked">Locked</option>
            <option value="Inactive">Inactive</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="flex-1" />

        <div className="relative">
          <select className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none min-w-[120px]">
            <option>관리자명</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder="관리자명 입력"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[240px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => { setStatusFilter(''); setKeyword(''); setPage(1); }}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >초기화</button>
        <button
          onClick={() => setInviteOpen(true)}
          className="h-10 px-4 inline-flex items-center text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          관리자 초대
        </button>
      </div>

      <SimpleTable<Admin>
        columns={[
          { key: 'status', label: '계정상태', width: '100px', render: (r) => {
            const cfg = STATUS_BADGE[r.status];
            return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}>{r.status}</span>;
          }},
          { key: 'permission', label: '권한명', width: '140px' },
          { key: 'name', label: '관리자명', width: '140px', render: (r) => <span className="font-medium text-gray-900">{r.name}</span> },
          { key: 'email', label: '이메일' },
          { key: 'registeredAt', label: '등록일시', width: '160px' },
          { key: 'lastLoginAt', label: '최근 로그인 일시', width: '170px' },
        ]}
        rows={paged}
        onRowClick={(a) => router.push(`/admins/${a.id}`)}
      />

      <SimplePagination page={page} totalPages={totalPages} onChange={setPage} />

      <InviteAdminModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}
