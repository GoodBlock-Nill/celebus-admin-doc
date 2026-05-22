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
  FIXED_REWARD_MAX,
  type CampaignRewardBive,
  type CampaignStatus,
  type MintCampaign,
  type RewardMethod,
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

  const weightSum = rewards.reduce((s, r) => s + (r.weight ?? 0), 0);
  const setTab = (k: string) => router.push(`/bive/minting/${campaignId}?tab=${k}`);
  const actions = headerActionsFor(campaign.status);
  const typeLabel = campaign.type.charAt(0) + campaign.type.slice(1).toLowerCase();

  // [CEB-BO-BIVE-203] §2-3 보상 방식 — WEIGHTED / FIXED 세그먼티드 컨트롤
  // 초안·중지 상태에서 전환 가능. 활성·종료는 read-only (campaign.rewardMethod 표시만)
  const editable = campaign.status === '초안' || campaign.status === '중지';
  const [rewardMethod, setRewardMethod] = useState<RewardMethod>(campaign.rewardMethod);
  const handleMethodChange = (next: RewardMethod) => {
    if (!editable) return;
    if (next === 'FIXED' && rewards.length > FIXED_REWARD_MAX) {
      alert(`[Mock] 지정 보상은 최대 ${FIXED_REWARD_MAX}종까지 등록 가능합니다. 현재 ${rewards.length}종 → 상위 ${FIXED_REWARD_MAX}종만 유지됩니다.`);
    }
    setRewardMethod(next);
  };

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
          editable={editable}
          rewardMethod={rewardMethod}
          onMethodChange={handleMethodChange}
          onAdd={() => setAddOpen(true)}
        />
      )}
      {tab === 'history' && (
        <HistoryTab
          campaign={campaign}
          rewardMethod={rewardMethod}
          keyword={historyKeyword}
          setKeyword={setHistoryKeyword}
        />
      )}

      <AddBiveRewardModal
        isOpen={addOpen}
        existingBiveIds={rewards.map((r) => r.biveId)}
        maxCount={rewardMethod === 'FIXED' ? FIXED_REWARD_MAX : undefined}
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
  rewardMethod,
  onMethodChange,
  onAdd,
}: {
  rewards: CampaignRewardBive[];
  weightSum: number;
  editable: boolean;
  rewardMethod: RewardMethod;
  onMethodChange: (m: RewardMethod) => void;
  onAdd: () => void;
}) {
  const isFixed = rewardMethod === 'FIXED';
  const fixedReachedLimit = isFixed && rewards.length >= FIXED_REWARD_MAX;
  const canAdd = editable && !fixedReachedLimit;

  // 컬럼 분기 — 가중치 보상: 가중치/비중 표시 / 지정 보상: 가중치·비중 컬럼 숨김
  const columns: React.ComponentProps<typeof SimpleTable<CampaignRewardBive>>['columns'] = [
    { key: 'biveName', label: 'BIVE 명칭', wrap: true, render: (r) => <span className="text-gray-900">{r.biveName}</span> },
    { key: 'artistGroup', label: '아티스트 그룹', width: '130px' },
    { key: 'artist', label: '아티스트', width: '100px' },
    { key: 'grade', label: '등급', width: '80px' },
    { key: 'gradeNumber', label: '등급번호', width: '90px' },
  ];
  if (!isFixed) {
    columns.push(
      { key: 'weight', label: '가중치', width: '110px', render: (r) => (
        <input
          type="number"
          defaultValue={r.weight ?? 0}
          disabled={!editable}
          className="w-20 h-9 px-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
        />
      )},
      { key: 'pct', label: '가중치 비중', width: '120px', render: (r) => (
        <span className="text-gray-700">{weightSum && r.weight ? ((r.weight / weightSum) * 100).toFixed(1) : '0.0'}%</span>
      )},
    );
  }
  columns.push({ key: 'manage', label: '관리', width: '60px', render: () => (
    editable
      ? <button className="text-red-500 text-xs hover:underline">삭제</button>
      : <span className="text-gray-300 text-xs">-</span>
  )});

  return (
    <div>
      {/* 보상 방식 세그먼티드 컨트롤 ([CEB-BO-BIVE-203] §2-3 v1.2) */}
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          {([
            { key: 'WEIGHTED' as const, label: '가중치 보상' },
            { key: 'FIXED' as const, label: '지정 보상' },
          ]).map((m) => (
            <button
              key={m.key}
              onClick={() => onMethodChange(m.key)}
              disabled={!editable}
              className={`px-5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                rewardMethod === m.key ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-800'
              } disabled:cursor-not-allowed disabled:opacity-70`}
              title={editable ? '' : '활성·종료 상태에서는 보상 방식을 변경할 수 없습니다.'}
            >
              {m.label}
            </button>
          ))}
        </div>
        {!editable && (
          <span className="text-xs text-gray-400">활성·종료 상태에서는 변경할 수 없습니다</span>
        )}
      </div>

      <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg text-sm mb-4">
        {isFixed
          ? `캠페인 트리거 시 등록된 모든 BIVE가 동시에 지급됩니다. 최대 ${FIXED_REWARD_MAX}종까지 등록 가능 (${rewards.length}/${FIXED_REWARD_MAX}).`
          : '보상으로 지급되는 BIVE를 추가하고 각 항목에 가중치를 입력하세요.'}
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="text-sm">
          {isFixed ? (
            <>
              <span className="text-gray-500 mr-2">등록 BIVE:</span>
              <span className="text-indigo-600 font-semibold">{rewards.length}</span>
              <span className="text-gray-400 ml-1">/ {FIXED_REWARD_MAX}</span>
            </>
          ) : (
            <>
              <span className="text-gray-500 mr-2">가중치 합:</span>
              <span className="text-indigo-600 font-semibold">{weightSum}</span>
            </>
          )}
        </div>
        {editable && (
          <button
            onClick={onAdd}
            disabled={!canAdd}
            title={fixedReachedLimit ? `최대 ${FIXED_REWARD_MAX}종까지 등록 가능합니다.` : ''}
            className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            <PlusIcon className="w-4 h-4" />추가하기
          </button>
        )}
      </div>

      <SimpleTable<CampaignRewardBive>
        columns={columns}
        rows={rewards}
        emptyMessage="+ 추가 버튼을 눌러 BIVE를 등록하세요."
      />
    </div>
  );
}

function HistoryTab({
  campaign,
  rewardMethod,
  keyword,
  setKeyword,
}: {
  campaign: MintCampaign;
  rewardMethod: RewardMethod;
  keyword: string;
  setKeyword: (s: string) => void;
}) {
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const isFixed = rewardMethod === 'FIXED';
  // [CEB-BO-BIVE-203] §2-4 보상내역 탭: BIVE별 발행 현황
  // 가중치 보상: BIVE 명칭 / 민팅 수 / 가중치 / 가중치 비중
  // 지정 보상: BIVE 명칭 / 민팅 수 (가중치·비중 컬럼 "-" 표시)
  // 활성·중지·종료 상태에서만 의미. 초안 상태는 빈 안내.
  const rewards = getCampaignRewards(campaign.id);
  const weightSum = rewards.reduce((s, r) => s + (r.weight ?? 0), 0);
  const sorted = [...rewards].sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0) || a.gradeNumber.localeCompare(b.gradeNumber));
  const filtered = sorted.filter((r) => (keyword ? r.biveName.toLowerCase().includes(keyword.toLowerCase()) : true));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (campaign.status === '초안') {
    return (
      <div className="bg-amber-50 text-amber-700 px-4 py-3 rounded-lg text-sm">
        초안 상태에서는 보상내역이 표시되지 않습니다. 캠페인 활성화 후 발행 내역이 누적됩니다.
      </div>
    );
  }

  return (
    <div>
      <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg text-sm mb-4">
        {isFixed
          ? '본 캠페인은 지정 보상 방식입니다. 트리거 1회당 등록된 모든 BIVE가 동시 발행됩니다. BIVE 명칭을 클릭하면 BIVE 상세 §민팅이력 탭이 새 창으로 열립니다.'
          : '본 캠페인의 BIVE별 실제 민팅 발행 현황입니다. BIVE 명칭을 클릭하면 BIVE 상세 §민팅이력 탭이 새 창으로 열립니다.'}
      </div>
      <div className="flex items-center justify-end gap-3 mb-4">
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
      <SimpleTable<typeof paged[number]>
        columns={[
          {
            key: 'biveName',
            label: 'BIVE 명칭',
            wrap: true,
            render: (r) => (
              <a
                href={`/bive/editions/${r.editionId}/bives/${r.biveId}?tab=history`}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline inline-flex items-center gap-1"
              >
                {r.biveName}
                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
              </a>
            ),
          },
          { key: 'mintedCount', label: '민팅 수', width: '110px', render: (r) => r.mintedCount.toLocaleString() },
          {
            key: 'weight',
            label: '가중치',
            width: '110px',
            render: (r) => (isFixed || !r.weight
              ? <span className="text-gray-400">-</span>
              : r.weight),
          },
          {
            key: 'pct',
            label: '가중치 비중',
            width: '120px',
            render: (r) => (isFixed || !r.weight || !weightSum
              ? <span className="text-gray-400">-</span>
              : `${((r.weight / weightSum) * 100).toFixed(1)}%`),
          },
        ]}
        rows={paged}
        emptyMessage="등록된 BIVE 보상이 없습니다."
      />
      <SimplePagination page={page} totalPages={totalPages || 1} onChange={setPage} />
    </div>
  );
}
