'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { rftLogs, sourcePolicies, type RftLog, type RftSourceFeature } from '@/mock/rft';

const PAGE_SIZE = 20;

type StatusType = 'ISSUED' | 'USED';

function parseStatus(raw: string | null): StatusType {
  return raw === 'USED' ? 'USED' : 'ISSUED';
}

function HistoryInner() {
  const search = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<StatusType>(parseStatus(search.get('type')));
  const [sourceFilter, setSourceFilter] = useState<RftSourceFeature | 'all'>(
    (search.get('source') as RftSourceFeature) ?? 'all',
  );
  const [artistFilter, setArtistFilter] = useState<string>('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const sourceLabelMap = useMemo(
    () => Object.fromEntries(sourcePolicies.map((s) => [s.code, s.nameKO])),
    [],
  );

  const filtered = useMemo(() => {
    return rftLogs.filter((l) => {
      // 발급/사용 부호 기준 분류
      if (statusFilter === 'ISSUED' && l.delta <= 0) return false;
      if (statusFilter === 'USED' && l.delta >= 0) return false;
      if (sourceFilter !== 'all' && l.sourceFeature !== sourceFilter) return false;
      if (artistFilter !== 'all') {
        const a = l.sourceArtistContext ?? '전역';
        if (a !== artistFilter) return false;
      }
      if (keyword && !l.nickname.toLowerCase().includes(keyword.toLowerCase())) return false;
      return true;
    });
  }, [statusFilter, sourceFilter, artistFilter, keyword]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const aggTotal = filtered.reduce((s, l) => s + Math.abs(l.delta), 0);

  return (
    <div>
      <PageHeader title="응모권 변동 내역" breadcrumbItems={[{ label: '응모권' }, { label: '변동 내역' }]} />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* 변동 유형 필수 선택 (발급/사용 토글) */}
        <div className="inline-flex items-center bg-white border border-gray-200 rounded-lg p-0.5" role="radiogroup" aria-label="변동 유형">
          {([
            { v: 'ISSUED' as const, label: '발급', activeBg: 'bg-emerald-100 text-emerald-700' },
            { v: 'USED' as const, label: '사용', activeBg: 'bg-rose-100 text-rose-700' },
          ]).map(({ v, label, activeBg }) => {
            const active = statusFilter === v;
            return (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => { setStatusFilter(v); setPage(1); }}
                className={`h-9 px-4 text-sm rounded-md transition ${active ? `${activeBg} font-semibold` : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="relative">
          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value as RftSourceFeature | 'all'); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[180px]"
          >
            <option value="all">출처(전체)</option>
            {sourcePolicies.map((s) => <option key={s.code} value={s.code}>{s.nameKO}</option>)}
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={artistFilter}
            onChange={(e) => { setArtistFilter(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[180px]"
          >
            <option value="all">아티스트 컨텍스트(전체)</option>
            <option value="V01D">V01D</option>
            <option value="iKON">iKON</option>
            <option value="CELEBUS">CELEBUS</option>
            {/* [CEB-BO-RFT-201] §2-1 정합 — "전역" 라벨 (2026-05-21 sync 정정, 구 "전역(NULL)") */}
            <option value="전역">전역</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex-1" />
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder="닉네임 검색"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[220px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => {
            setStatusFilter('ISSUED'); setSourceFilter('all'); setArtistFilter('all'); setKeyword(''); setPage(1);
          }}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          초기화
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">필터 결과</div>
          <div className="text-lg font-bold text-gray-900">{filtered.length.toLocaleString()}건</div>
        </div>
        {statusFilter === 'ISSUED' ? (
          <div className="bg-emerald-50 rounded-lg p-3">
            <div className="text-xs text-emerald-700 mb-1">발급 합계</div>
            <div className="text-lg font-bold text-emerald-700">+{aggTotal.toLocaleString()}장</div>
          </div>
        ) : (
          <div className="bg-rose-50 rounded-lg p-3">
            <div className="text-xs text-rose-700 mb-1">사용 합계</div>
            <div className="text-lg font-bold text-rose-700">-{aggTotal.toLocaleString()}장</div>
          </div>
        )}
      </div>

      <SimpleTable<RftLog>
        columns={[
          { key: 'occurredAt', label: '일시', width: '130px' },
          { key: 'nickname', label: '회원', width: '160px', render: (r) => (
            // [CEB-BO-RFT-201] §2-3·§4 정합 — 삭제 회원 클릭 비활성 + "(삭제됨)" 라벨 (2026-05-21 sync 정정)
            r.memberDeleted ? (
              <span className="text-gray-400 inline-flex items-center gap-1.5" title="삭제된 회원">
                {r.nickname}
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">삭제됨</span>
              </span>
            ) : (
              <a
                href={`/members/${r.memberId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-900 font-medium hover:text-indigo-600 hover:underline inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
                title="새 탭으로 회원 상세 진입"
              >
                {r.nickname}
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )
          )},
          { key: 'status', label: '상태', width: '80px', render: (r) => (
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
              r.status === 'ISSUED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {r.status === 'ISSUED' ? '발급' : '사용'}
            </span>
          )},
          { key: 'delta', label: '변동', width: '90px', align: 'right', render: (r) => (
            <span className={r.delta > 0 ? 'text-emerald-600 font-semibold' : 'text-rose-500 font-semibold'}>
              {r.delta > 0 ? '+' : ''}{r.delta}장
            </span>
          )},
          { key: 'balanceAfter', label: '잔액', width: '80px', align: 'right', render: (r) => (
            <span className="text-gray-700">{r.balanceAfter}장</span>
          )},
          // [CEB-BO-RFT-201] v2.6 정합 — 운영 카테고리 3종 폐기로 정규 출처 한국어 라벨만 표시 (2026-05-21 정정)
          { key: 'sourceFeature', label: '출처', width: '160px', render: (r) => (
            <span className="text-gray-700" title={sourceLabelMap[r.sourceFeature] ?? r.sourceFeature}>
              {sourceLabelMap[r.sourceFeature] ?? r.sourceFeature}
            </span>
          )},
          { key: 'sourceArtistContext', label: '아티스트 컨텍스트', width: '150px', render: (r) => (
            <span className={r.sourceArtistContext ? 'inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700' : 'text-gray-400 text-xs'}>
              {r.sourceArtistContext ?? '전역'}
            </span>
          )},
          // [CEB-BO-RFT-201] v2.7 §2-3-1 정합 — 출처별 참조 표기·이동 매트릭스 (2026-05-26 정정)
          // GP_EXCHANGE는 별도 상세 화면 부재로 이동 없음(회색 평문). 그 외는 클릭 가능 시각 표기(파란 밑줄)
          // 실제 router.push는 후속 사이클(영역별 상세 라우트 확정 후)
          { key: 'sourceRefId', label: '참조', render: (r) => {
            const navigable = r.sourceFeature !== 'GP_EXCHANGE';
            return navigable ? (
              <span
                className="text-blue-600 underline cursor-pointer text-xs hover:text-blue-800"
                title="출처 엔티티 상세로 이동 (라우트 후속 사이클)"
              >
                {r.sourceRefId}
              </span>
            ) : (
              <span className="text-gray-500 text-xs">{r.sourceRefId}</span>
            );
          }},
        ]}
        rows={paged}
        emptyMessage="조건에 맞는 변동 내역이 없습니다."
      />

      <SimplePagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

export default function RftHistoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">로딩 중...</div>}>
      <HistoryInner />
    </Suspense>
  );
}
