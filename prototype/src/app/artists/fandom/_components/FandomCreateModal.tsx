'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { FANDOM_GROUPS, FANDOM_SEASON_YEARS, type FandomLevel } from '@/mock/fandom';

// 팬덤레벨 최소 생성 모달 — 아티스트 + 시즌 연도 → 준비 생성.
// 시즌 기간은 선택 연도 1.1~12.31 자동. 곡선·보상은 상세에서 설정.
interface Props {
  isOpen: boolean;
  existing: FandomLevel[];
  onClose: () => void;
  onCreate: (groupName: string, season: string, year: number) => void;
}

export default function FandomCreateModal({ isOpen, existing, onClose, onCreate }: Props) {
  const [groupName, setGroupName] = useState(FANDOM_GROUPS[0]);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [season, setSeason] = useState('');

  // 시즌명 자동 제안 — 해당 그룹의 기존 시즌 수 + 1기, 선택 연도 반영
  const suggested = useMemo(() => {
    const count = existing.filter((f) => f.groupName === groupName).length;
    return `${groupName} 팬덤 ${count + 1}기 (${year})`;
  }, [groupName, existing, year]);

  // 동일 아티스트·동일 연도 중복 생성 차단
  const isDuplicate = useMemo(
    () => existing.some((f) => f.groupName === groupName && f.seasonPeriod.startsWith(`${year}.`)),
    [groupName, year, existing],
  );

  useEffect(() => { if (isOpen) setSeason(suggested); }, [isOpen, suggested]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 pt-6 pb-2">
          <h3 className="text-base font-semibold text-gray-900 mb-1">팬덤레벨 생성</h3>
          <p className="text-sm text-gray-500">아티스트와 시즌 연도를 선택해 준비 상태로 생성합니다. 레벨 곡선·보상은 생성 후 상세에서 설정합니다.</p>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">아티스트</label>
            <div className="relative">
              <select value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {FANDOM_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">시즌 연도</label>
            <div className="relative">
              <select value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))} className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {FANDOM_SEASON_YEARS.map((y) => <option key={y} value={y}>{y}년</option>)}
              </select>
              <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <p className="mt-1.5 text-xs text-gray-400">시즌 기간은 {year}.01.01 ~ {year}.12.31로 자동 설정됩니다.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">시즌명 <span className="text-gray-400 font-normal">(자동 제안 · 수정 가능)</span></label>
            <input value={season} onChange={(e) => setSeason(e.target.value)} placeholder="시즌명 입력" className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          {isDuplicate && (
            <p className="text-xs text-red-500">동일 아티스트의 {year}년 시즌이 이미 존재합니다.</p>
          )}
        </div>
        <div className="flex items-center gap-2 px-6 pb-6 pt-2">
          <button onClick={onClose} className="flex-1 h-11 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
          <button
            onClick={() => { if (!isDuplicate) onCreate(groupName, season.trim() || suggested, year); }}
            disabled={isDuplicate}
            className="flex-1 h-11 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >생성</button>
        </div>
      </div>
    </div>
  );
}
