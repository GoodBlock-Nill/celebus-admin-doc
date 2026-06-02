'use client';

import { useEffect, useState } from 'react';
import CreateModal from '@/components/clone/CreateModal';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { toast } from '@/components/ui/Toast';
import type { ArtistPosition, SettingStatus } from '@/mock/artists';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  position?: ArtistPosition | null;
  existingNames?: string[]; // 중복 검사용 기존 운영자 노출명 목록
}

const MAX = 50;

export default function PositionModal({ isOpen, onClose, mode, position, existingNames = [] }: Props) {
  const [operatorName, setOperatorName] = useState('');
  const [nameKO, setNameKO] = useState('');
  const [nameEN, setNameEN] = useState('');
  const [nameJP, setNameJP] = useState('');
  const [status, setStatus] = useState<SettingStatus>('사용');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setOperatorName(position?.operatorName ?? '');
    setNameKO(position?.nameKO ?? '');
    setNameEN(position?.nameEN ?? '');
    setNameJP(position?.nameJP ?? '');
    setStatus(position?.status ?? '사용');
    setNameError('');
  }, [isOpen, position]);

  // 중복 검사: 수정 시 자기 자신은 제외
  const isDuplicate = (name: string) =>
    existingNames.some((n) => n === name.trim() && n !== position?.operatorName);

  const canSubmit =
    operatorName.trim().length > 0 &&
    nameKO.trim().length > 0 &&
    nameEN.trim().length > 0 &&
    nameJP.trim().length > 0;

  const field = (label: string, value: string, setValue: (v: string) => void, placeholder: string) => (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-2">
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, MAX))}
        placeholder={placeholder}
        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <div className="mt-1 text-right text-xs text-gray-400">{value.length}/{MAX}</div>
    </div>
  );

  return (
    <CreateModal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'add' ? '새 포지션 추가' : '포지션 수정'}
      width="max-w-md"
      disabled={!canSubmit}
      submitLabel={mode === 'add' ? '추가하기' : '저장하기'}
      onSubmit={() => {
        if (isDuplicate(operatorName)) {
          setNameError('이미 등록된 포지션명입니다.');
          toast.error('이미 등록된 포지션명입니다.');
          return;
        }
        toast.success(mode === 'add' ? '포지션을 추가했습니다.' : '포지션을 수정했습니다.');
        onClose();
      }}
    >
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          운영자 노출명 <span className="text-red-500">*</span>
        </label>
        <input
          value={operatorName}
          onChange={(e) => { setOperatorName(e.target.value.slice(0, MAX)); setNameError(''); }}
          placeholder="운영자 노출명 입력"
          className={`w-full h-10 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${nameError ? 'border-red-400' : 'border-gray-200'}`}
        />
        <div className="mt-1 flex items-center justify-between">
          {nameError ? <span className="text-xs text-red-500">{nameError}</span> : <span />}
          <span className="text-xs text-gray-400">{operatorName.length}/{MAX}</span>
        </div>
      </div>
      {field('한국어 (유저 노출명)', nameKO, setNameKO, '포지션명 입력')}
      {field('영어 (유저 노출명)', nameEN, setNameEN, 'Enter position')}
      {field('일본어 (유저 노출명)', nameJP, setNameJP, 'ポジション名入力')}

      {mode === 'edit' && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">상태설정</label>
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SettingStatus)}
              className="w-full h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="사용">사용</option>
              <option value="미사용">미사용</option>
            </select>
            <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}
    </CreateModal>
  );
}
