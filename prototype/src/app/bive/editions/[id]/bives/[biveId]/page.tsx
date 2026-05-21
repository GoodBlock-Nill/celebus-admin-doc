'use client';

import { use, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { TrashIcon, ArrowTopRightOnSquareIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import {
  getBiveTokenById,
  getEditionById,
  mintCampaigns,
  getMintHistory,
  type BiveToken,
  type BiveStatus,
} from '@/mock/bive';
import DeleteBiveModal from './DeleteBiveModal';

const TABS = [
  { key: 'info', label: '기본정보' },
  { key: 'feature', label: '기능설정' },
  { key: 'minting', label: '민팅관리' },
  { key: 'history', label: '민팅이력' },
] as const;

const STATUS_BADGE: Record<BiveStatus, string> = {
  Active: 'bg-emerald-100 text-emerald-700',
  Inactive: 'bg-red-100 text-red-700',
  Draft: 'bg-amber-100 text-amber-700',
};

export default function BiveDetailPage({ params }: { params: Promise<{ id: string; biveId: string }> }) {
  const { id, biveId } = use(params);
  const editionId = parseInt(id, 10);
  const tokenId = parseInt(biveId, 10);
  const edition = getEditionById(editionId);
  const token = getBiveTokenById(editionId, tokenId);
  const router = useRouter();
  const search = useSearchParams();
  const tab = (search.get('tab') as typeof TABS[number]['key']) || 'info';
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!edition || !token) {
    return <div className="p-8 text-sm text-gray-500">BIVE를 찾을 수 없습니다.</div>;
  }

  const setTab = (k: string) => router.push(`/bive/editions/${editionId}/bives/${tokenId}?tab=${k}`);
  const canDelete = token.status === 'Draft' && token.mintedCount === 0;
  const activeLabel = token.status === 'Active' ? '비활성화' : '활성화';

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/bive/editions/${editionId}`)}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="뒤로가기"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <PageHeader
            title="BIVE 상세"
            breadcrumbItems={[
              { label: 'BIVE' },
              { label: '에디션 관리', href: '/bive/editions' },
              { label: '에디션 BIVE 관리', href: `/bive/editions/${editionId}` },
              { label: 'BIVE 상세' },
            ]}
          />
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[token.status]}`}>
            {token.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canDelete && (
            <button
              onClick={() => setDeleteOpen(true)}
              className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50"
            >
              <TrashIcon className="w-4 h-4" />삭제
            </button>
          )}
          <button
            onClick={() => alert(`[Mock] ${activeLabel}`)}
            className="h-10 px-5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
          >
            {activeLabel}
          </button>
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

      {tab === 'info' && <InfoTab token={token} editionName={edition.nameKR} />}
      {tab === 'feature' && <FeatureTab token={token} />}
      {tab === 'minting' && <MintingTab token={token} />}
      {tab === 'history' && <HistoryTab token={token} />}

      <DeleteBiveModal
        isOpen={deleteOpen}
        biveName={token.name}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          alert(`[Mock] BIVE 삭제: ${token.name}`);
          setDeleteOpen(false);
          router.push(`/bive/editions/${editionId}`);
        }}
      />
    </div>
  );
}

function InfoTab({ token, editionName }: { token: BiveToken; editionName: string }) {
  const readOnly = token.status !== 'Draft';
  return (
    <div>
      {readOnly && (
        <div className="bg-amber-50 text-amber-700 px-4 py-3 rounded-lg text-sm mb-6">
          Draft 상태에서만 정보를 수정할 수 있습니다.
        </div>
      )}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">BIVE 명칭</h3>
          <div className="text-base font-semibold text-gray-900">{token.name}</div>
          <p className="text-xs text-gray-500 mt-2">멤버명, 등급, 등급번호를 기반으로 자동 생성됩니다.</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">관리 정보</h3>
          <div className="space-y-2.5 text-sm">
            <Stat label="상태"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[token.status]}`}>{token.status}</span></Stat>
            <Stat label="생성 관리자">nill</Stat>
            <Stat label="생성 일시">{token.registeredAt} 15:44</Stat>
            <Stat label="최근 수정자">nill</Stat>
            <Stat label="최근 수정 일시">{token.registeredAt} 15:44</Stat>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">기본 정보</h3>
          <ReadField label="에디션" value={editionName} />
          <ReadField label="아티스트 그룹" required value={token.artistGroup} />
          <ReadField label="아티스트" required value={token.artist} />
          <ReadField label="등급" required value={token.grade} />
          <ReadField label="등급번호" required value={token.gradeNumber} />
          <ReadField label="설명 (영문)" value={token.description || ''} multiline />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">미디어 파일</h3>
          <div className="aspect-square bg-gradient-to-br from-orange-100 to-pink-100 rounded-lg flex items-center justify-center text-xs text-gray-500">
            미디어 미리보기
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureTab({ token }: { token: BiveToken }) {
  return (
    <div className="max-w-xl space-y-5">
      <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg text-sm">
        BIVE의 사용 가능 기능을 ON/OFF 합니다. 활성 상태에서도 토글 변경이 가능합니다.
      </div>
      {([
        { key: 'send', label: '보내기 (Send)', desc: '회원 간 BIVE 양도 허용 여부' },
        { key: 'mix', label: 'Mix', desc: 'BIVE 합성에 사용 가능 여부' },
        { key: 'pick', label: 'Pick', desc: 'BIVE 픽에 사용 가능 여부' },
      ] as const).map((row) => (
        <div key={row.key} className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 bg-white">
          <div>
            <div className="text-sm font-medium text-gray-900">{row.label}</div>
            <div className="text-xs text-gray-500">{row.desc}</div>
          </div>
          <span className={`relative inline-flex h-6 w-11 rounded-full ${token.toggles[row.key] ? 'bg-indigo-600' : 'bg-gray-300'}`}>
            <span className={`inline-block h-5 w-5 rounded-full bg-white mt-0.5 ${token.toggles[row.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </span>
        </div>
      ))}
    </div>
  );
}

function MintingTab({ token }: { token: BiveToken }) {
  const router = useRouter();
  const linked = mintCampaigns.filter((c) => c.name.includes(token.artist) || c.name.includes(token.artistGroup)).slice(0, 5);

  return (
    <div>
      <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg text-sm mb-4">
        본 BIVE가 보상으로 등록된 민팅 이벤트 목록입니다. 캠페인 이름을 클릭하면 상세로 이동합니다.
      </div>
      <SimpleTable
        columns={[
          { key: 'id', label: 'ID', width: '60px' },
          { key: 'status', label: '상태', width: '80px', render: (r: typeof linked[number]) => (
            <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-700">{r.status}</span>
          )},
          { key: 'name', label: '캠페인 명', render: (r) => <span className="text-gray-900">{r.name}</span> },
          { key: 'linkedFeature', label: '연결 기능', width: '140px', render: (r) => <span className="text-indigo-600">{r.linkedFeature}</span> },
          { key: 'minted', label: '발행 수', width: '90px' },
          { key: 'createdAt', label: '생성일', width: '160px' },
        ]}
        rows={linked}
        emptyMessage="연결된 민팅 이벤트가 없습니다."
        onRowClick={(c) => router.push(`/bive/minting/${c.id}?tab=info`)}
      />
    </div>
  );
}

function HistoryTab({ token }: { token: BiveToken }) {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const all = getMintHistory(token.id + 100, Math.min(token.mintedCount, 50));
  const filtered = all.filter((h) => (keyword ? h.nickname.includes(keyword) || h.tokenId.includes(keyword) : true));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg text-sm mb-4">
        본 BIVE의 회원 단위 민팅 발행 내역입니다. 지갑주소는 BSCScan 새 창에서 확인할 수 있습니다.
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
          { key: 'walletAddress', label: '지갑주소', render: (r) => (
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

function ReadField({ label, value, required, multiline }: { label: string; value: string; required?: boolean; multiline?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-2">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {multiline ? (
        <textarea
          value={value}
          readOnly
          rows={3}
          className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-gray-50 resize-none"
          placeholder="-"
        />
      ) : (
        <input
          value={value}
          readOnly
          className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50"
        />
      )}
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900">{children}</span>
    </div>
  );
}
