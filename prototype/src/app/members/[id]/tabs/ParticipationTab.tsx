'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { InboxIcon } from '@heroicons/react/24/outline';
import type { Member } from '@/mock/members';
import { getVotesByMember } from '@/mock/members';

type SubTab = 'vote' | 'quest' | 'raffle' | 'boost';

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: 'vote', label: '투표' },
  { key: 'quest', label: 'Quest' },
  { key: 'raffle', label: 'Raffle' },
  { key: 'boost', label: '부스팅' },
];

const COLUMNS_BY_TAB: Record<SubTab, string[]> = {
  vote: ['상태', '프로젝트명', '투표유형', '타이틀', '누적 투표 수', '최근 참여일시'],
  quest: ['상태', 'QUEST 타이틀', '승인여부', '최근 참여일시', '최근 처리 일시'],
  raffle: ['상태', 'RAFFLE 타이틀', '당첨여부', '누적 사용 응모권', '최근 참여일시'],
  boost: ['상태', '프로젝트명', '미션', '참가자명', '누적 BP', '최근 참여일시'],
};

export default function ParticipationTab({ member }: { member: Member }) {
  const [active, setActive] = useState<SubTab>('vote');
  const [keyword, setKeyword] = useState('');

  const votes = getVotesByMember(member.id);
  const filteredVotes = keyword
    ? votes.filter(
        (v) =>
          v.projectName.toLowerCase().includes(keyword.toLowerCase()) ||
          v.title.toLowerCase().includes(keyword.toLowerCase()),
      )
    : votes;

  const cols = COLUMNS_BY_TAB[active];

  // 투표 탭만 데이터, 나머지는 빈 데이터 (운영 동일)
  const rows: React.ReactNode[][] =
    active === 'vote'
      ? filteredVotes.map((v) => [
          <span
            key="s"
            className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700"
          >
            {v.status}
          </span>,
          v.projectName,
          v.voteType,
          v.title,
          v.totalVotes.toLocaleString(),
          v.lastEnteredAt,
        ])
      : [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      {/* 서브탭 + 검색 */}
      <div className="flex items-center justify-between mb-5">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          {SUB_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setActive(t.key);
                setKeyword('');
              }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                active === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="검색어 입력"
              className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[260px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => setKeyword('')}
            className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {cols.map((c) => (
                <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length > 0 ? (
              rows.map((cells, ri) => (
                <tr key={ri} className="hover:bg-gray-50">
                  {cells.map((cell, ci) => (
                    <td key={ci} className="px-4 py-3 text-sm text-gray-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={cols.length} className="px-4 py-16 text-center">
                  <InboxIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">참여 내역이 없습니다.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
