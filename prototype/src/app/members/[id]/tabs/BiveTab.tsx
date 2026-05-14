'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { InboxIcon } from '@heroicons/react/24/outline';
import type { Member } from '@/mock/members';
import { getBivesByMember, type BiveOwned } from '@/mock/members';
import BiveDetailModal from '../modals/BiveDetailModal';

export default function BiveTab({ member }: { member: Member }) {
  const bives = getBivesByMember(member.id);
  const [keyword, setKeyword] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [selected, setSelected] = useState<BiveOwned | null>(null);

  const filtered = bives
    .filter((b) => (gradeFilter ? b.grade === gradeFilter : true))
    .filter((b) => (keyword ? b.biveName.toLowerCase().includes(keyword.toLowerCase()) : true));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <p className="text-sm text-gray-700">
          <span className="text-gray-500">총 보유</span>{' '}
          <span className="text-base font-semibold text-gray-900">{bives.length}</span>
          <span className="text-gray-500">개</span>
        </p>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">등급(전체)</option>
              <option value="Event">Event</option>
              <option value="Ticket">Ticket</option>
              <option value="Mix">Mix</option>
              <option value="Pick">Pick</option>
            </select>
            <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="BIVE 명칭 입력"
              className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[240px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => {
              setKeyword('');
              setGradeFilter('');
            }}
            className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
          >
            초기화
          </button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['이미지', '에디션', 'BIVE 명칭', '등급', 'TOKEN ID', '보내기', 'MIX', 'PICK'].map((c) => (
                <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length > 0 ? (
              filtered.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => setSelected(b)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 rounded bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-[8px] font-bold text-gray-600 overflow-hidden">
                      {/* 운영 이미지 src 사용 시 next.config 도메인 등록 필요 — 클론에서는 placeholder */}
                      BIVE
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">CELEBUS</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{b.biveName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{b.grade}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 font-mono">{b.tokenIdShort}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${b.canSend ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {b.canSend ? '가능' : '불가능'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${b.canMix ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {b.canMix ? '가능' : '불가능'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${b.canPick ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {b.canPick ? '가능' : '불가능'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center">
                  <InboxIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">보유한 BIVE가 없습니다.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <BiveDetailModal bive={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
