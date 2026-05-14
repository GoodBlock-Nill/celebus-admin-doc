'use client';

import { useState } from 'react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import StatCardWithBar from '@/components/clone/StatCardWithBar';
import SimpleTable from '@/components/clone/SimpleTable';
import { rewards, type FandomReward, type RewardType, type DistributionType } from '@/mock/evt';

const REWARD_TYPE_LABEL: Record<RewardType, { label: string; bg: string; text: string }> = {
  EXCLUSIVE_CONTENT: { label: '독점 콘텐츠', bg: 'bg-purple-100', text: 'text-purple-700' },
  DIGITAL: { label: '디지털', bg: 'bg-sky-100', text: 'text-sky-700' },
  DOWNLOAD: { label: '다운로드', bg: 'bg-blue-100', text: 'text-blue-700' },
  GOODS: { label: '실물 굿즈', bg: 'bg-amber-100', text: 'text-amber-700' },
  EVENT: { label: '이벤트', bg: 'bg-rose-100', text: 'text-rose-700' },
};

const DIST_BADGE: Record<DistributionType, { bg: string; text: string; label: string }> = {
  ALL: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '전원 지급' },
  LOTTERY: { bg: 'bg-violet-100', text: 'text-violet-700', label: '추첨' },
};

export default function EvtRewardsPage() {
  const [artistFilter, setArtistFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = rewards
    .filter((r) => (artistFilter ? r.artistGroup === artistFilter : true))
    .filter((r) => (typeFilter ? r.rewardType === typeFilter : true));

  const totalRecipients = filtered.reduce((sum, r) => sum + r.recipientCount, 0);
  const lotteryCount = filtered.filter((r) => r.distributionType === 'LOTTERY').length;
  const allCount = filtered.filter((r) => r.distributionType === 'ALL').length;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader title="레벨 보상" breadcrumbItems={[{ label: '팬덤 레벨' }, { label: '레벨 보상' }]} />
        <button
          onClick={() => alert('[Mock] 보상 추가 (EVT-301-CREATE)')}
          className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          <PlusIcon className="w-4 h-4" />새 보상 추가
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCardWithBar label="전체 보상" count={filtered.length} variant="default" />
        <StatCardWithBar label="전원 지급(ALL)" count={allCount} variant="active" />
        <StatCardWithBar label="추첨(LOTTERY)" count={lotteryCount} variant="pending" />
        <StatCardWithBar label="총 수령 인원" count={totalRecipients} variant="default" />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={artistFilter}
            onChange={(e) => setArtistFilter(e.target.value)}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[160px]"
          >
            <option value="">아티스트(전체)</option>
            <option value="V01D">V01D</option>
            <option value="iKON">iKON</option>
            <option value="CELEBUS">CELEBUS</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[160px]"
          >
            <option value="">보상 타입(전체)</option>
            <option value="EXCLUSIVE_CONTENT">독점 콘텐츠</option>
            <option value="DIGITAL">디지털</option>
            <option value="DOWNLOAD">다운로드</option>
            <option value="GOODS">실물 굿즈</option>
            <option value="EVENT">이벤트</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <SimpleTable<FandomReward>
        columns={[
          { key: 'level', label: '레벨', width: '70px', align: 'right', render: (r) => (
            <span className="text-indigo-700 font-bold">Lv.{r.level}</span>
          )},
          { key: 'artistGroup', label: '아티스트', width: '100px', render: (r) => (
            <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700">{r.artistGroup}</span>
          )},
          { key: 'rewardType', label: '타입', width: '120px', render: (r) => {
            const cfg = REWARD_TYPE_LABEL[r.rewardType];
            return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
          }},
          { key: 'distributionType', label: '지급 방식', width: '100px', render: (r) => {
            const cfg = DIST_BADGE[r.distributionType];
            return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
          }},
          { key: 'titleKO', label: '보상 내용', render: (r) => (
            <div>
              <div className="text-gray-900 font-medium">{r.titleKO}</div>
              <div className="text-xs text-gray-500 mt-0.5">{r.description}</div>
            </div>
          )},
          { key: 'recipientCount', label: '수령 인원', width: '100px', align: 'right', render: (r) => (
            <span className="text-emerald-600 font-semibold">{r.recipientCount.toLocaleString()}</span>
          )},
          { key: 'active', label: '상태', width: '80px', render: (r) => r.active
            ? <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700">활성</span>
            : <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-500">비활성</span>
          },
        ]}
        rows={filtered}
        emptyMessage="조건에 맞는 보상이 없습니다."
      />
    </div>
  );
}
