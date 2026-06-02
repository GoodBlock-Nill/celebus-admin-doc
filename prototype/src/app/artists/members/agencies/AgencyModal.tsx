'use client';

import { useEffect, useState } from 'react';
import CreateModal from '@/components/clone/CreateModal';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { toast } from '@/components/ui/Toast';
import { artistAgencies, type ArtistAgency, type SettingStatus } from '@/mock/artists';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  agency?: ArtistAgency | null;
}

const MAX = 50;

export default function AgencyModal({ isOpen, onClose, mode, agency }: Props) {
  const [operatorName, setOperatorName] = useState('');
  const [nameKO, setNameKO] = useState('');
  const [nameEN, setNameEN] = useState('');
  const [nameJP, setNameJP] = useState('');
  const [status, setStatus] = useState<SettingStatus>('사용');
  const [dupError, setDupError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setOperatorName(agency?.operatorName ?? '');
    setNameKO(agency?.nameKO ?? '');
    setNameEN(agency?.nameEN ?? '');
    setNameJP(agency?.nameJP ?? '');
    setStatus(agency?.status ?? '사용');
    setDupError('');
  }, [isOpen, agency]);

  const canSubmit =
    operatorName.trim().length > 0 &&
    nameKO.trim().length > 0 &&
    nameEN.trim().length > 0 &&
    nameJP.trim().length > 0;

  // 운영자 노출명 중복 검사 (수정 시 자기 자신 제외)
  const isDuplicate = (value: string) =>
    artistAgencies.some(
      (a) => a.operatorName.trim() === value.trim() && a.id !== agency?.id,
    );

  const handleSubmit = () => {
    if (isDuplicate(operatorName)) {
      setDupError('이미 등록된 소속사명입니다.');
      toast.error('이미 등록된 소속사명입니다.');
      return;
    }
    toast.success(mode === 'add' ? '소속사를 추가했습니다.' : '소속사를 수정했습니다.');
    onClose();
  };

  const field = (
    label: string,
    value: string,
    setValue: (v: string) => void,
    placeholder: string,
  ) => (
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
      title={mode === 'add' ? '새 소속사 추가' : '소속사 수정'}
      width="max-w-md"
      disabled={!canSubmit}
      submitLabel={mode === 'add' ? '추가하기' : '저장하기'}
      onSubmit={handleSubmit}
    >
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          운영자 노출명 <span className="text-red-500">*</span>
        </label>
        <input
          value={operatorName}
          onChange={(e) => { setOperatorName(e.target.value.slice(0, MAX)); setDupError(''); }}
          placeholder="운영자 노출명 입력"
          className={`w-full h-10 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
            dupError ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-indigo-500'
          }`}
        />
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-red-500">{dupError}</span>
          <span className="text-xs text-gray-400">{operatorName.length}/{MAX}</span>
        </div>
      </div>
      {field('한국어 (유저 노출명)', nameKO, setNameKO, '소속사명 입력')}
      {field('영어 (유저 노출명)', nameEN, setNameEN, 'Enter Company Name')}
      {field('일본어 (유저 노출명)', nameJP, setNameJP, '会社名を入力')}

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
          <p className="text-xs text-gray-400 mt-1.5">미사용으로 변경해도 이미 배정된 멤버의 소속사는 유지되며, 멤버 등록·수정 시 소속사 선택 목록에서만 제외됩니다.</p>
        </div>
      )}
    </CreateModal>
  );
}
