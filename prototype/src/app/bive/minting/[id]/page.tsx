'use client';

import { use, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { getCampaignById, getCampaignRewards, type CampaignRewardBive } from '@/mock/bive';

const TABS = [
  { key: 'info', label: '기본정보' },
  { key: 'bive', label: 'BIVE 보상' },
  { key: 'history', label: '보상내역' },
] as const;

export default function MintingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const campaignId = parseInt(id, 10);
  const campaign = getCampaignById(campaignId);
  const rewards = getCampaignRewards(campaignId);
  const search = useSearchParams();
  const router = useRouter();
  const tab = (search.get('tab') as 'info' | 'bive' | 'history') || 'info';
  const [historyKeyword, setHistoryKeyword] = useState('');

  if (!campaign) {
    return <div className="p-8 text-sm text-gray-500">캠페인을 찾을 수 없습니다.</div>;
  }

  const weightSum = rewards.reduce((s, r) => s + r.weight, 0);
  const historyFiltered = rewards.filter((r) => historyKeyword ? r.biveName.includes(historyKeyword) : true);

  const setTab = (k: string) => router.push(`/bive/minting/${campaignId}?tab=${k}`);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title="Event 캠페인 상세"
          breadcrumbItems={[
            { label: 'BIVE' },
            { label: '민팅 관리', href: '/bive/minting' },
            { label: campaign.name },
          ]}
        />
        <button className="h-10 px-4 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50">
          {campaign.status === '활성' ? '일시중지' : '재개'}
        </button>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'info' && <InfoTab campaign={campaign} />}
      {tab === 'bive' && <BiveRewardTab rewards={rewards} weightSum={weightSum} />}
      {tab === 'history' && (
        <HistoryTab rewards={historyFiltered} keyword={historyKeyword} setKeyword={setHistoryKeyword} />
      )}
    </div>
  );
}

function InfoTab({ campaign }: { campaign: NonNullable<ReturnType<typeof getCampaignById>> }) {
  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-5">
        <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg text-sm">
          캠페인 식별을 위한 캠페인 명을 입력하고, 연결기능을 선택해 주세요.
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">캠페인 명</label>
          <input
            defaultValue={campaign.name}
            className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">연결 기능</label>
          <div className="relative">
            <select defaultValue={campaign.linkedFeature} className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm appearance-none bg-white">
              <option>{campaign.linkedFeature}</option>
              <option>회원가입 보상</option>
              <option>팬퀘스트 보상</option>
            </select>
            <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
      <div className="border border-gray-200 rounded-xl p-5 h-fit">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">관리 정보</h4>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">상태</span>
            <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-700">
              {campaign.status === '활성' ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">생성 일시</span>
            <span className="text-gray-900">{campaign.createdAt.split(' ')[0]}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">최근 수정 일시</span>
            <span className="text-gray-900">{campaign.createdAt.split(' ')[0]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BiveRewardTab({ rewards, weightSum }: { rewards: CampaignRewardBive[]; weightSum: number }) {
  return (
    <div>
      <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg text-sm mb-4">
        보상으로 지급되는 BIVE를 추가하고 각 항목에 가중치를 입력하세요
      </div>
      <div className="text-right text-sm mb-3">
        <span className="text-gray-500 mr-2">가중치 합:</span>
        <span className="text-indigo-600 font-semibold">{weightSum}</span>
      </div>
      <SimpleTable<CampaignRewardBive>
        columns={[
          { key: 'biveName', label: 'BIVE명칭', render: (r) => <span className="text-gray-900">{r.biveName}</span> },
          { key: 'artistGroup', label: '아티스트', width: '120px' },
          { key: 'member', label: '멤버', width: '90px' },
          { key: 'grade', label: '등급', width: '80px' },
          { key: 'gradeNumber', label: '등급번호', width: '90px' },
          { key: 'weight', label: '가중치', width: '110px', render: (r) => (
            <input
              type="number"
              defaultValue={r.weight}
              className="w-20 h-9 px-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )},
          { key: 'pct', label: '가중치 비중', width: '110px', render: (r) => `${weightSum ? ((r.weight / weightSum) * 100).toFixed(1) : '0.0'}%` },
          { key: 'manage', label: '관리', width: '70px', render: () => (
            <button className="text-red-500 text-xs hover:underline">삭제</button>
          )},
        ]}
        rows={rewards}
        emptyMessage="등록된 BIVE 보상이 없습니다."
      />
    </div>
  );
}

function HistoryTab({ rewards, keyword, setKeyword }: { rewards: CampaignRewardBive[]; keyword: string; setKeyword: (s: string) => void }) {
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(rewards.length / PAGE_SIZE);
  const paged = rewards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalMint = rewards.reduce((s, r) => s + r.mintedCount, 0);

  return (
    <div>
      <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg text-sm mb-4">
        BIVE 보상의 민팅 현황입니다.
      </div>
      <div className="flex items-center justify-end gap-3 mb-4">
        <div className="relative">
          <select className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none min-w-[140px]">
            <option>BIVE명칭</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder="BIVE명칭 입력"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[240px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button onClick={() => setKeyword('')} className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">
          초기화
        </button>
      </div>
      <SimpleTable<CampaignRewardBive>
        columns={[
          { key: 'biveName', label: 'BIVE명칭', render: (r) => <span className="text-gray-900">{r.biveName}</span> },
          { key: 'mintedCount', label: '민팅 수', width: '120px', render: (r) => r.mintedCount.toLocaleString() },
          { key: 'weight', label: '가중치', width: '120px' },
          { key: 'pct', label: '가중치 비중', width: '160px', render: (r) => `${r.mintedCount}/${totalMint || 1} (${totalMint ? ((r.mintedCount / totalMint) * 100).toFixed(2) : '0.00'}%)` },
        ]}
        rows={paged}
        emptyMessage="민팅 내역이 없습니다."
      />
      <SimplePagination page={page} totalPages={totalPages || 1} onChange={setPage} />
    </div>
  );
}
