'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowTopRightOnSquareIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import SimpleTable from '@/components/clone/SimpleTable';
import {
  REWARD_GRANT_STATUSES,
  type FandomLevel,
  type LevelUpHistory,
  type RewardGrant,
  type RewardGrantStatus,
  type LevelUpProcessStatus,
} from '@/mock/fandom';

// 레벨업 처리 상태 뱃지
const processBadge: Record<LevelUpProcessStatus, string> = {
  대기: 'bg-gray-100 text-gray-500',
  처리중: 'bg-blue-100 text-blue-700',
  완료: 'bg-emerald-100 text-emerald-700',
  실패: 'bg-red-100 text-red-700',
};

// 지급 상태 뱃지 (6종)
const grantBadge: Record<RewardGrantStatus, string> = {
  '지급 대기': 'bg-gray-100 text-gray-500',
  '자동 지급 완료': 'bg-emerald-100 text-emerald-700',
  '추첨 대기': 'bg-amber-100 text-amber-700',
  당첨: 'bg-indigo-100 text-indigo-700',
  '지급 완료': 'bg-emerald-500 text-white',
  '지급 실패': 'bg-red-100 text-red-700',
};

export default function HistoryTab({ fandom }: { fandom: FandomLevel }) {
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const grants = fandom.rewardGrants
    .filter((g) => (levelFilter ? g.level === parseInt(levelFilter, 10) : true))
    .filter((g) => (statusFilter ? g.grantStatus === statusFilter : true));

  const levelOptions = Array.from(new Set(fandom.rewardGrants.map((g) => g.level))).sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      {/* 레벨업 이력 */}
      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">레벨업 이력</h2>
        <SimpleTable<LevelUpHistory>
          columns={[
            { key: 'level', label: '레벨', width: '100px', render: (r) => <span className="font-medium text-gray-900">Lv.{r.level}</span> },
            { key: 'achievedAt', label: '달성 일시', width: '180px' },
            { key: 'processStatus', label: '처리 상태', width: '120px', render: (r) => (
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${processBadge[r.processStatus]}`}>{r.processStatus}</span>
            )},
            { key: 'targetMemberCount', label: '대상 회원 수', width: '140px', render: (r) => `${r.targetMemberCount.toLocaleString()} 명` },
          ]}
          rows={fandom.levelUpHistory}
          emptyMessage="레벨업 이력이 없습니다."
        />
      </section>

      {/* 보상 지급 현황 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">보상 지급 현황</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">레벨(전체)</option>
                {levelOptions.map((l) => <option key={l} value={l}>Lv.{l}</option>)}
              </select>
              <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[150px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">지급 상태(전체)</option>
                {REWARD_GRANT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <SimpleTable<RewardGrant>
          columns={[
            { key: 'member', label: '회원', width: '160px', render: (r) => <span className="font-medium text-gray-900">{r.member}</span> },
            { key: 'level', label: '레벨', width: '90px', render: (r) => `Lv.${r.level}` },
            { key: 'rewardName', label: '보상명', render: (r) => <span className="text-gray-700">{r.rewardName}</span> },
            { key: 'payout', label: '지급 방식', width: '110px', render: (r) => (
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${r.payout === '추첨' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{r.payout}</span>
            )},
            { key: 'winnerYn', label: '당첨 여부', width: '100px', render: (r) => (
              r.payout === '전체 지급' ? <span className="text-gray-400">-</span> : (r.winnerYn ? <span className="text-indigo-600 font-medium">당첨</span> : <span className="text-gray-500">미당첨</span>)
            )},
            { key: 'grantStatus', label: '지급 상태', width: '140px', render: (r) => (
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${grantBadge[r.grantStatus]}`}>{r.grantStatus}</span>
            )},
            { key: 'date', label: '일시', width: '160px' },
          ]}
          rows={grants}
          emptyMessage={levelFilter || statusFilter ? '검색 결과가 없습니다.' : '보상 지급 내역이 없습니다.'}
        />

        <Link href="/artists/fandom/status" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700">
          전체 통합 조회는 보상·레벨업 현황 메뉴
          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
