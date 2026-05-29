'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowTopRightOnSquareIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import SimpleTable from '@/components/clone/SimpleTable';
import {
  MINT_STATUSES,
  type FandomLevel,
  type LevelUpHistory,
  type BiveGrant,
  type MintStatus,
} from '@/mock/fandom';

// BIVE 민팅 상태 뱃지 — [CEB-BO-EVT-201] §2.5
const mintBadge: Record<MintStatus, string> = {
  대기: 'bg-gray-100 text-gray-500',
  민팅중: 'bg-blue-100 text-blue-700',
  완료: 'bg-emerald-100 text-emerald-700',
};

export default function HistoryTab({ fandom }: { fandom: FandomLevel }) {
  const [levelFilter, setLevelFilter] = useState('');
  const [mintFilter, setMintFilter] = useState('');

  const grants = fandom.biveGrants
    .filter((g) => (levelFilter ? g.level === parseInt(levelFilter, 10) : true))
    .filter((g) => (mintFilter ? g.mintStatus === mintFilter : true));

  const levelOptions = Array.from(new Set(fandom.biveGrants.map((g) => g.level))).sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      <p className="text-sm font-medium text-gray-500">이 시즌 현황</p>
      {/* 레벨업 이력 */}
      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">레벨업 이력</h2>
        <SimpleTable<LevelUpHistory>
          columns={[
            { key: 'level', label: '레벨', width: '90px', render: (r) => <span className="font-medium text-gray-900">Lv.{r.level}</span> },
            { key: 'achievedAt', label: '달성 일시', width: '170px' },
            { key: 'targetMemberCount', label: '대상 회원 수', width: '130px', render: (r) => `${r.targetMemberCount.toLocaleString()} 명` },
            { key: 'rewardSummary', label: '연결 보상', render: (r) => <span className="text-gray-700">{r.rewardSummary}</span> },
          ]}
          rows={fandom.levelUpHistory}
          emptyMessage="레벨업 이력이 없습니다."
        />
      </section>

      {/* 디지털 굿즈(BIVE) 지급 연계 현황 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">디지털 굿즈(BIVE) 지급 연계 현황</h2>
            <p className="mt-0.5 text-xs text-gray-400">디지털 굿즈 보상만 지급 대상입니다. 래플·서포트 예고는 앱 안내 표시 전용이라 표시되지 않습니다.</p>
          </div>
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
                value={mintFilter}
                onChange={(e) => setMintFilter(e.target.value)}
                className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[130px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">민팅 상태(전체)</option>
                {MINT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <SimpleTable<BiveGrant>
          columns={[
            { key: 'member', label: '회원', width: '160px', render: (r) => <span className="font-medium text-gray-900">{r.member}</span> },
            { key: 'level', label: '레벨', width: '90px', render: (r) => `Lv.${r.level}` },
            { key: 'campaignName', label: '캠페인', render: (r) => <span className="text-gray-700">{r.campaignName}</span> },
            { key: 'mintStatus', label: '지급 상태', width: '120px', render: (r) => (
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${mintBadge[r.mintStatus]}`}>{r.mintStatus}</span>
            )},
            { key: 'date', label: '일시', width: '160px' },
          ]}
          rows={grants}
          emptyMessage={levelFilter || mintFilter ? '검색 결과가 없습니다.' : 'BIVE 지급 연계 내역이 없습니다.'}
        />

        <Link href="/artists/fandom/status" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700">
          전체 통합 조회는 보상·레벨업 현황 메뉴
          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
