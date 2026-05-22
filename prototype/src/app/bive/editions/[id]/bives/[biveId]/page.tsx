'use client';

import { use, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { TrashIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { ChevronLeftIcon } from '@heroicons/react/20/solid';
import Breadcrumb from '@/components/layout/Breadcrumb';
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

  // [CEB-BO-BIVE-202] §4 상태별 헤더 액션 매트릭스
  // Draft: [삭제] + [저장] + [활성화]
  // Active: [비활성화] (연결 캠페인이 모두 종료된 경우만)
  // Inactive: [활성화]
  const linkedActiveCampaigns = mintCampaigns.filter(
    (c) => (c.name.includes(token.artist) || c.name.includes(token.artistGroup)) && (c.status === '활성' || c.status === '중지'),
  );
  const canDeactivate = token.status === 'Active' && linkedActiveCampaigns.length === 0;
  const handleDeactivate = () => {
    if (linkedActiveCampaigns.length > 0) {
      alert(`[Mock] 비활성화 실패: 활성/중지 상태 캠페인 ${linkedActiveCampaigns.length}건이 연결되어 있습니다. 모두 종료 후 다시 시도해주세요.`);
      return;
    }
    alert('[Mock] 비활성화');
  };

  return (
    <div>
      <div className="mb-6">
        <Breadcrumb customItems={[
          { label: 'BIVE' },
          { label: '에디션 관리', href: '/bive/editions' },
          { label: '에디션 BIVE 관리', href: `/bive/editions/${editionId}` },
          { label: 'BIVE 상세' },
        ]} />
        {/* 운영 BO 정합 — 페이지 제목 라인: ← 뒤로가기 + "BIVE 상세" + 상태 배지 인라인 + 우측 액션 */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/bive/editions/${editionId}`)}
              className="w-7 h-7 inline-flex items-center justify-center rounded text-gray-500 hover:bg-gray-100"
              aria-label="뒤로가기"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <h1 className="text-[28px] font-bold text-gray-900">BIVE 상세</h1>
            <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ml-1 ${STATUS_BADGE[token.status]}`}>
              {token.status}
            </span>
          </div>
        <div className="flex items-center gap-2">
          {token.status === 'Draft' && (
            <>
              <button
                onClick={() => setDeleteOpen(true)}
                className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50"
              >
                <TrashIcon className="w-4 h-4" />삭제
              </button>
              <button
                onClick={() => alert('[Mock] 저장')}
                className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                저장
              </button>
              <button
                onClick={() => alert('[Mock] 활성화')}
                className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                활성화
              </button>
            </>
          )}
          {token.status === 'Active' && (
            <button
              onClick={handleDeactivate}
              disabled={!canDeactivate}
              title={canDeactivate ? '비활성화' : `활성/중지 캠페인 ${linkedActiveCampaigns.length}건 연결됨`}
              className="h-10 px-5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-gray-200 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              비활성화
            </button>
          )}
          {token.status === 'Inactive' && (
            <button
              onClick={() => alert('[Mock] 활성화')}
              className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              활성화
            </button>
          )}
        </div>
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
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">미디어 파일</h3>
            <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-700">
              {token.mediaType === 'image' ? '이미지' : token.mediaType === 'video' ? '영상' : '음성'}
            </span>
          </div>
          <MediaPreview token={token} />
        </div>
      </div>
    </div>
  );
}

function FeatureTab({ token }: { token: BiveToken }) {
  // [CEB-BO-BIVE-202] §2-3: Draft 상태에서만 토글 수정 가능 (운영 BO 정합)
  // Active/Inactive 상태에서는 read-only
  const editable = token.status === 'Draft';
  const [toggles, setToggles] = useState(token.toggles);

  return (
    <div className="max-w-xl space-y-5">
      <div className={`px-4 py-3 rounded-lg text-sm ${editable ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
        {editable
          ? 'BIVE의 사용 가능 기능을 ON/OFF 합니다. Draft 상태에서만 수정할 수 있습니다.'
          : 'Draft 상태에서만 기능설정을 수정할 수 있습니다. 활성·비활성 상태에서는 조회만 가능합니다.'}
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
          {editable ? (
            <button
              type="button"
              onClick={() => setToggles((p) => ({ ...p, [row.key]: !p[row.key] }))}
              className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${toggles[row.key] ? 'bg-indigo-600' : 'bg-gray-300'}`}
              aria-label={`${row.label} 토글`}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white transform transition-transform mt-0.5 ${toggles[row.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          ) : (
            <span
              className={`relative inline-flex h-6 w-11 rounded-full opacity-60 cursor-not-allowed ${toggles[row.key] ? 'bg-indigo-600' : 'bg-gray-300'}`}
              title="Draft 상태에서만 수정할 수 있습니다"
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white mt-0.5 ${toggles[row.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function MintingTab({ token }: { token: BiveToken }) {
  // [CEB-BO-BIVE-202] §2-4·§7: 캠페인명 클릭 시 [203] 캠페인 상세 새 창 (target=_blank)
  const linked = mintCampaigns.filter((c) => c.name.includes(token.artist) || c.name.includes(token.artistGroup)).slice(0, 5);

  return (
    <div>
      <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg text-sm mb-4">
        본 BIVE가 보상으로 등록된 민팅 이벤트 목록입니다. 캠페인 이름을 클릭하면 캠페인 상세가 새 창으로 열립니다.
      </div>
      <SimpleTable
        columns={[
          { key: 'id', label: 'ID', width: '60px' },
          { key: 'status', label: '상태', width: '80px', render: (r: typeof linked[number]) => (
            <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-700">{r.status}</span>
          )},
          { key: 'name', label: '캠페인 명', wrap: true, render: (r) => (
            <a
              href={`/bive/minting/${r.id}?tab=info`}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 hover:underline inline-flex items-center gap-1"
            >
              {r.name}
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
            </a>
          )},
          { key: 'minted', label: '발행 수', width: '90px' },
          { key: 'createdAt', label: '생성일', width: '160px' },
        ]}
        rows={linked}
        emptyMessage="연결된 캠페인이 없습니다."
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

// 미디어 미리보기 — 타입별 분기 (v1.5 / [CEB-BO-BIVE-202] v1.6)
function MediaPreview({ token }: { token: BiveToken }) {
  if (token.mediaType === 'image') {
    return (
      <div className="space-y-4">
        <div>
          <div className={`aspect-square rounded-lg flex items-center justify-center text-xs ${token.mediaUrl ? 'bg-gradient-to-br from-orange-100 to-pink-100 text-gray-600' : 'bg-gray-50 border border-dashed border-gray-300 text-gray-400'}`}>
            {token.mediaUrl ? '메인 이미지 미리보기' : '메인 이미지 미등록'}
          </div>
          <div className="text-xs text-center mt-2 text-gray-600">메인 이미지</div>
        </div>
        <div>
          <div className={`aspect-square rounded-lg flex items-center justify-center text-xs ${token.mediaAltUrl ? 'bg-gradient-to-br from-indigo-100 to-purple-100 text-gray-600' : 'bg-gray-50 border border-dashed border-gray-300 text-gray-400'}`}>
            {token.mediaAltUrl ? '서브 이미지 미리보기' : '서브 이미지 미등록 (선택)'}
          </div>
          <div className="text-xs text-center mt-2 text-gray-600">서브 이미지</div>
        </div>
      </div>
    );
  }
  if (token.mediaType === 'video') {
    return (
      <div className="space-y-4">
        <div>
          <div className={`aspect-video rounded-lg flex items-center justify-center text-xs ${token.mediaUrl ? 'bg-gradient-to-br from-emerald-100 to-cyan-100 text-gray-700' : 'bg-gray-50 border border-dashed border-gray-300 text-gray-400'}`}>
            {token.mediaUrl ? '▶ 영상 미리보기' : '영상 미등록'}
          </div>
          <div className="text-xs text-center mt-2 text-gray-600">영상 (MP4)</div>
        </div>
        <div>
          <div className={`aspect-square rounded-lg flex items-center justify-center text-xs ${token.mediaAltUrl ? 'bg-gradient-to-br from-indigo-100 to-purple-100 text-gray-600' : 'bg-gray-50 border border-dashed border-gray-300 text-gray-400'}`}>
            {token.mediaAltUrl ? '썸네일 미리보기' : '썸네일 미등록'}
          </div>
          <div className="text-xs text-center mt-2 text-gray-600">썸네일</div>
        </div>
      </div>
    );
  }
  // audio
  return (
    <div className="space-y-4">
      <div>
        <div className={`aspect-square rounded-lg flex items-center justify-center text-xs ${token.mediaAltUrl ? 'bg-gradient-to-br from-indigo-100 to-purple-100 text-gray-600' : 'bg-gray-50 border border-dashed border-gray-300 text-gray-400'}`}>
          {token.mediaAltUrl ? '썸네일 미리보기' : '썸네일 미등록'}
        </div>
        <div className="text-xs text-center mt-2 text-gray-600">썸네일</div>
      </div>
      <div>
        <div className={`h-16 rounded-lg flex items-center justify-center gap-2 text-xs ${token.mediaUrl ? 'bg-gradient-to-r from-amber-100 to-rose-100 text-gray-700' : 'bg-gray-50 border border-dashed border-gray-300 text-gray-400'}`}>
          {token.mediaUrl ? '♪ 음성 재생 미리보기' : '음성 미등록'}
        </div>
        <div className="text-xs text-center mt-2 text-gray-600">음성 (MP3)</div>
      </div>
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
