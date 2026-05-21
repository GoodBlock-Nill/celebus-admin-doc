'use client';

import { use, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { ArrowTopRightOnSquareIcon, PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import {
  getCampaignById,
  getCampaignRewards,
  getMintHistory,
  type CampaignRewardBive,
  type CampaignStatus,
  type MintCampaign,
} from '@/mock/bive';
import AddBiveRewardModal from '../AddBiveRewardModal';

const TABS = [
  { key: 'info', label: '기본정보' },
  { key: 'bive', label: 'BIVE 보상' },
  { key: 'history', label: '보상내역' },
] as const;

const LINKED_FEATURES = ['회원가입 보상', '출석체크 보상', '래플 보상', '팬퀘스트 보상'];

const STATUS_BADGE: Record<CampaignStatus, string> = {
  '초안': 'bg-amber-100 text-amber-700',
  '활성': 'bg-emerald-100 text-emerald-700',
  '중지': 'bg-red-100 text-red-700',
  '종료': 'bg-gray-200 text-gray-700',
};

// 4상태별 헤더 액션 매트릭스 ([CEB-BO-BIVE-203] §4 정합)
function headerActionsFor(status: CampaignStatus): { label: string; tone: 'primary' | 'danger' | 'neutral'; action: string }[] {
  switch (status) {
    case '초안':
      return [
        { label: '삭제', tone: 'danger', action: '캠페인 삭제' },
        { label: '활성화', tone: 'primary', action: '초안 → 활성 (되돌리기 불가)' },
      ];
    case '활성':
      return [{ label: '일시중지', tone: 'danger', action: '활성 → 중지' }];
    case '중지':
      return [
        { label: '활성 재개', tone: 'primary', action: '중지 → 활성' },
        { label: '종료 요청', tone: 'danger', action: '개발팀 수동 처리 요청' },
      ];
    case '종료':
      return [];
  }
}

export default function MintingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const campaignId = parseInt(id, 10);
  const campaign = getCampaignById(campaignId);
  const rewards = getCampaignRewards(campaignId);
  const search = useSearchParams();
  const router = useRouter();
  const tab = (search.get('tab') as 'info' | 'bive' | 'history') || 'info';
  const [historyKeyword, setHistoryKeyword] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  if (!campaign) {
    return <div className="p-8 text-sm text-gray-500">캠페인을 찾을 수 없습니다.</div>;
  }

  const weightSum = rewards.reduce((s, r) => s + r.weight, 0);
  const setTab = (k: string) => router.push(`/bive/minting/${campaignId}?tab=${k}`);
  const actions = headerActionsFor(campaign.status);
  const typeLabel = campaign.type.charAt(0) + campaign.type.slice(1).toLowerCase();

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title={`${typeLabel} 캠페인 상세`}
          breadcrumbItems={[
            { label: 'BIVE' },
            { label: '민팅 관리', href: '/bive/minting' },
            { label: campaign.name },
          ]}
        />
        <div className="flex items-center gap-2">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={() => alert(`[Mock] ${a.action}`)}
              title={a.action}
              className={
                a.tone === 'danger'
                  ? 'h-10 px-4 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-gray-200'
                  : a.tone === 'primary'
                  ? 'h-10 px-4 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700'
                  : 'h-10 px-4 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50'
              }
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              tab === t.key ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'info' && <InfoTab campaign={campaign} />}
      {tab === 'bive' && (
        <BiveRewardTab
          rewards={rewards}
          weightSum={weightSum}
          editable={campaign.status === '초안' || campaign.status === '중지'}
          onAdd={() => setAddOpen(true)}
        />
      )}
      {tab === 'history' && (
        <HistoryTab campaign={campaign} keyword={historyKeyword} setKeyword={setHistoryKeyword} />
      )}

      <AddBiveRewardModal
        isOpen={addOpen}
        existingBiveIds={rewards.map((r) => r.biveId)}
        onClose={() => setAddOpen(false)}
        onAdd={(selected) => {
          alert(`[Mock] BIVE 보상 ${selected.length}건 추가`);
          setAddOpen(false);
        }}
      />
    </div>
  );
}

function InfoTab({ campaign }: { campaign: MintCampaign }) {
  const readOnly = campaign.status !== '초안';
  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-5">
        <div className={`px-4 py-3 rounded-lg text-sm ${readOnly ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'}`}>
          {readOnly
            ? '활성/중지/종료 상태에서는 기본정보를 수정할 수 없습니다.'
            : '캠페인 식별을 위한 캠페인 명을 입력하고, 연결기능을 선택해 주세요.'}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">캠페인 명</label>
          <input
            defaultValue={campaign.name}
            disabled={readOnly}
            placeholder="캠페인 명을 입력하세요"
            className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">연결 기능</label>
          <div className="relative">
            <select
              defaultValue={campaign.linkedFeature}
              disabled={readOnly}
              className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm appearance-none bg-white disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">연결 기능을 선택해주세요</option>
              {LINKED_FEATURES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
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
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[campaign.status]}`}>{campaign.status}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">유형</span>
            <span className="text-gray-900">{campaign.type}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">생성 일시</span>
            <span className="text-gray-900">{campaign.createdAt.split(' ')[0]}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">발행 수</span>
            <span className="text-gray-900">{campaign.minted.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BiveRewardTab({
  rewards,
  weightSum,
  editable,
  onAdd,
}: {
  rewards: CampaignRewardBive[];
  weightSum: number;
  editable: boolean;
  onAdd: () => void;
}) {
  return (
    <div>
      <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg text-sm mb-4">
        보상으로 지급되는 BIVE를 추가하고 각 항목에 가중치를 입력하세요.
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm">
          <span className="text-gray-500 mr-2">가중치 합:</span>
          <span className="text-indigo-600 font-semibold">{weightSum}</span>
        </div>
        {editable && (
          <button
            onClick={onAdd}
            className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50"
          >
            <PlusIcon className="w-4 h-4" />추가하기
          </button>
        )}
      </div>
      <SimpleTable<CampaignRewardBive>
        columns={[
          { key: 'biveName', label: 'BIVE 명칭', wrap: true, render: (r) => <span className="text-gray-900">{r.biveName}</span> },
          { key: 'artistGroup', label: '아티스트 그룹', width: '130px' },
          { key: 'artist', label: '아티스트', width: '100px' },
          { key: 'grade', label: '등급', width: '80px' },
          { key: 'gradeNumber', label: '등급번호', width: '90px' },
          { key: 'weight', label: '가중치', width: '110px', render: (r) => (
            <input
              type="number"
              defaultValue={r.weight}
              disabled={!editable}
              className="w-20 h-9 px-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
            />
          )},
          { key: 'pct', label: '가중치 비중', width: '120px', render: (r) => (
            <span className="text-gray-700">{weightSum ? ((r.weight / weightSum) * 100).toFixed(1) : '0.0'}%</span>
          )},
          { key: 'manage', label: '관리', width: '60px', render: () => (
            editable
              ? <button className="text-red-500 text-xs hover:underline">삭제</button>
              : <span className="text-gray-300 text-xs">-</span>
          )},
        ]}
        rows={rewards}
        emptyMessage="+ 추가 버튼을 눌러 BIVE를 등록하세요."
      />
    </div>
  );
}

function HistoryTab({
  campaign,
  keyword,
  setKeyword,
}: {
  campaign: MintCampaign;
  keyword: string;
  setKeyword: (s: string) => void;
}) {
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const all = getMintHistory(campaign.id, Math.min(campaign.minted, 50));
  const filtered = all.filter((h) => (keyword ? h.nickname.includes(keyword) || h.tokenId.includes(keyword) : true));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg text-sm mb-4">
        본 캠페인의 회원 단위 민팅 발행 내역입니다. 지갑주소는 BSCScan 새 창에서 확인할 수 있습니다.
      </div>
      <div className="flex items-center justify-end gap-3 mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder="닉네임 또는 토큰 ID"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[240px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button onClick={() => setKeyword('')} className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">
          초기화
        </button>
      </div>
      <SimpleTable
        columns={[
          { key: 'tokenId', label: 'Token ID', width: '160px', render: (r: typeof paged[number]) => <span className="font-mono text-xs">{r.tokenId}</span> },
          { key: 'nickname', label: '닉네임' },
          { key: 'walletAddress', label: '지갑주소', wrap: true, render: (r) => (
            <a href={`https://bscscan.com/address/${r.walletAddress}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-mono text-xs inline-flex items-center gap-1">
              {r.walletAddress}
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
            </a>
          )},
          { key: 'mintedAt', label: '민팅일시', width: '160px' },
        ]}
        rows={paged}
        emptyMessage="민팅 이력이 없습니다."
      />
      <SimplePagination page={page} totalPages={totalPages || 1} onChange={setPage} />
    </div>
  );
}
