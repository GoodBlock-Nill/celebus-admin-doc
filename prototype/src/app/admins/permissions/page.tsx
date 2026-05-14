'use client';

import { useState } from 'react';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import StatCardWithBar from '@/components/clone/StatCardWithBar';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { roles, roleStats, type Role } from '@/mock/admins';
import CreateRoleModal from '../CreateRoleModal';

export default function PermissionsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<Role>(roles[0]);
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = roles
    .filter((r) => (statusFilter ? r.status === statusFilter : true))
    .filter((r) => (keyword ? r.name.toLowerCase().includes(keyword.toLowerCase()) : true));

  const [tab, setTab] = useState<'basic' | 'permission' | 'admins'>('basic');

  return (
    <div>
      <PageHeader title="권한관리" breadcrumbItems={[{ label: '관리자' }, { label: '권한관리' }]} />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCardWithBar label="전체" count={roleStats.total} variant="default" />
        <StatCardWithBar label="Active" count={roleStats.active} variant="active" />
        <StatCardWithBar label="Inactive" count={roleStats.inactive} variant="inactive" />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="">상태(전체)</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex-1" />
        <div className="relative">
          <select className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none min-w-[120px]">
            <option>권한명</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="권한명 입력"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[240px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => { setStatusFilter(''); setKeyword(''); }}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >초기화</button>
        <button
          onClick={() => setCreateOpen(true)}
          className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          <PlusIcon className="w-4 h-4" />권한 생성
        </button>
      </div>

      <SimpleTable<Role>
        columns={[
          { key: 'status', label: '권한상태', width: '100px', render: (r) => (
            <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-500 text-white">{r.status}</span>
          )},
          { key: 'name', label: '권한명', render: (r) => (
            <span className="inline-flex items-center gap-2">
              <span className="font-medium text-gray-900">{r.name}</span>
              {r.meta && <span className={`text-xs px-2 py-0.5 rounded ${r.meta === '수정불가' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>{r.meta}</span>}
            </span>
          )},
          { key: 'adminCount', label: '관리자 수', width: '100px' },
          { key: 'adminNames', label: '관리자명' },
        ]}
        rows={filtered}
        onRowClick={(r) => setSelected(r)}
      />

      <SimplePagination page={1} totalPages={1} onChange={() => {}} />

      {/* 하단 상세 영역 */}
      <div className="mt-8 bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="grid grid-cols-3">
            {(['basic', 'permission', 'admins'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'
                }`}
              >
                {t === 'basic' ? '기본정보' : t === 'permission' ? '권한설정' : `관리자(${selected.adminCount})`}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {tab === 'basic' && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">권한정보</h4>
              <div className="grid grid-cols-[120px_1fr] gap-y-3 text-sm mb-6">
                <span className="text-gray-500">권한명</span>
                <span className="text-gray-900">{selected.name}</span>
                <span className="text-gray-500">권한설명</span>
                <span className="text-gray-900">{selected.description || '-'}</span>
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">상태정보</h4>
              <div className="grid grid-cols-[120px_1fr] gap-y-3 text-sm">
                <span className="text-gray-500">권한 상태</span>
                <span>
                  <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-500 text-white">{selected.status}</span>
                </span>
              </div>
            </div>
          )}
          {tab === 'permission' && (
            <p className="text-sm text-gray-500 text-center py-8">권한 설정은 추후 정의 예정입니다.</p>
          )}
          {tab === 'admins' && (
            <p className="text-sm text-gray-700">{selected.adminNames}</p>
          )}
        </div>
      </div>

      <CreateRoleModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
