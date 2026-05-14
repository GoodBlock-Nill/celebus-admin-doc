'use client';

import { useState } from 'react';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { PlusIcon, InboxIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import SuspensionReasonModal from './AddEditModal';

export default function SuspensionReasonsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="정지사유 설정"
        breadcrumbItems={[
          { label: '회원', href: '/members' },
          { label: '정지사유 설정' },
        ]}
      />

      {/* 필터·액션 */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">상태(전체)</option>
            <option value="ACTIVE">사용</option>
            <option value="INACTIVE">미사용</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="flex-1" />

        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="운영자 노출명 입력"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[260px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => {
            setKeyword('');
            setStatusFilter('');
          }}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          초기화
        </button>
        <button
          onClick={() => setModalOpen(true)}
          className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          <PlusIcon className="w-4 h-4" />새 사유 추가
        </button>
      </div>

      {/* 테이블 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">상태</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">운영자 노출명</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">유저 노출 메시지 (한국어)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">유저 노출 메시지 (영어)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">유저 노출 메시지 (일본어)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">수정하기</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-4 py-16 text-center">
                <InboxIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">등록된 정지사유가 없습니다.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <SuspensionReasonModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
