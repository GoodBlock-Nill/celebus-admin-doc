'use client';

import { useMemo, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import {
  editions,
  artistGroups,
  getEditionTokens,
  BIVE_GRADES,
  type BiveToken,
} from '@/mock/bive';

// [CEB-BO-BIVE-203-MD-ADD] BIVE 보상 추가 모달 v1.1
// 활성 상태 BIVE만 선택 가능. 이미 등록된 BIVE는 체크박스 비활성
// maxCount: 지정 보상(FIXED) 호출 시 잔여 가능 수량 전달. 초과 선택 차단.

export default function AddBiveRewardModal({
  isOpen,
  existingBiveIds,
  maxCount,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  existingBiveIds: number[];
  maxCount?: number; // 지정 보상 호출 시 잔여 가능 수량 (existing + selected ≤ maxCount)
  onClose: () => void;
  onAdd: (selected: BiveToken[]) => void;
}) {
  const [editionFilter, setEditionFilter] = useState<string>('');
  const [groupFilter, setGroupFilter] = useState<string>('');
  const [artistFilter, setArtistFilter] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<Record<number, BiveToken>>({});

  const allTokens = useMemo<BiveToken[]>(() => {
    const list: BiveToken[] = [];
    editions.forEach((e) => {
      if (!editionFilter || String(e.id) === editionFilter) {
        getEditionTokens(e.id).filter((t) => t.status === 'Active').forEach((t) => list.push(t));
      }
    });
    return list;
  }, [editionFilter]);

  const availableArtists = useMemo(() => {
    if (!groupFilter) return [] as string[];
    return artistGroups.find((g) => g.name === groupFilter)?.members ?? [];
  }, [groupFilter]);

  const filtered = useMemo(() => {
    return allTokens
      .filter((t) => (groupFilter ? t.artistGroup === groupFilter : true))
      .filter((t) => (artistFilter ? t.artist === artistFilter : true))
      .filter((t) => (gradeFilter ? t.grade === gradeFilter : true))
      .filter((t) => (keyword ? t.name.toLowerCase().includes(keyword.toLowerCase()) : true));
  }, [allTokens, groupFilter, artistFilter, gradeFilter, keyword]);

  const reset = () => {
    setEditionFilter(''); setGroupFilter(''); setArtistFilter('');
    setGradeFilter(''); setKeyword(''); setSelected({});
  };

  const handleClose = () => { reset(); onClose(); };

  const selectedCount = Object.keys(selected).length;
  const existingCount = existingBiveIds.length;
  const remainingSlots = maxCount !== undefined ? Math.max(0, maxCount - existingCount) : Infinity;
  const reachedLimit = selectedCount >= remainingSlots;

  const toggle = (t: BiveToken) => {
    if (existingBiveIds.includes(t.id)) return;
    setSelected((p) => {
      const next = { ...p };
      if (next[t.id]) {
        delete next[t.id];
      } else {
        if (Object.keys(next).length >= remainingSlots) {
          alert(`[Mock] 최대 ${maxCount}종까지 등록 가능합니다. (현재 등록 ${existingCount}종 + 선택 ${Object.keys(next).length}종)`);
          return next;
        }
        next[t.id] = t;
      }
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-gray-900">BIVE 보상 추가</h3>
            {maxCount !== undefined && (
              <span className={`text-xs px-2 py-0.5 rounded ${reachedLimit ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                지정 보상 — 잔여 {Math.max(0, remainingSlots - selectedCount)}/{remainingSlots}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleClose} className="h-9 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              취소
            </button>
            <button
              disabled={selectedCount === 0}
              onClick={() => onAdd(Object.values(selected))}
              className="h-9 px-4 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              추가 ({selectedCount})
            </button>
            <button onClick={handleClose} className="ml-2 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
              <XMarkIcon className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <FilterSelect label="에디션(전체)" value={editionFilter} onChange={setEditionFilter}>
            {editions.map((e) => <option key={e.id} value={String(e.id)}>{e.nameKR}</option>)}
          </FilterSelect>
          <FilterSelect label="아티스트 그룹(전체)" value={groupFilter} onChange={(v) => { setGroupFilter(v); setArtistFilter(''); }}>
            {artistGroups.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}
          </FilterSelect>
          <FilterSelect label="아티스트(전체)" value={artistFilter} onChange={setArtistFilter} disabled={!groupFilter}>
            {availableArtists.map((a) => <option key={a} value={a}>{a}</option>)}
          </FilterSelect>
          <FilterSelect label="등급(전체)" value={gradeFilter} onChange={setGradeFilter}>
            {BIVE_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </FilterSelect>
          <div className="flex-1" />
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="명칭 입력"
              className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[200px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-500">조건에 맞는 BIVE가 없습니다.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 w-10" />
                  <th className="px-4 py-2 text-left">BIVE 명칭</th>
                  <th className="px-4 py-2 text-left w-32">아티스트 그룹</th>
                  <th className="px-4 py-2 text-left w-28">아티스트</th>
                  <th className="px-4 py-2 text-left w-24">등급</th>
                  <th className="px-4 py-2 text-left w-24">등급번호</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const isExisting = existingBiveIds.includes(t.id);
                  const isSelected = !!selected[t.id];
                  return (
                    <tr
                      key={t.id}
                      onClick={() => toggle(t)}
                      className={`border-b border-gray-100 ${isExisting ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'hover:bg-indigo-50 cursor-pointer'}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isExisting}
                          onChange={() => toggle(t)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 accent-indigo-600"
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-900">{t.name}{isExisting && <span className="ml-2 text-xs text-gray-400">(이미 등록됨)</span>}</td>
                      <td className="px-4 py-3">{t.artistGroup}</td>
                      <td className="px-4 py-3">{t.artist}</td>
                      <td className="px-4 py-3">{t.grade}</td>
                      <td className="px-4 py-3">{t.gradeNumber}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  disabled,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none min-w-[150px] disabled:bg-gray-50"
      >
        <option value="">{label}</option>
        {children}
      </select>
      <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}
