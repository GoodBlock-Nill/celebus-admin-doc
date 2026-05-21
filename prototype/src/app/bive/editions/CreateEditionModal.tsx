'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function CreateEditionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [ko, setKo] = useState('');
  const [en, setEn] = useState('');
  const [jp, setJp] = useState('');

  const canSubmit = ko.trim().length > 0 && en.trim().length > 0 && jp.trim().length > 0;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">에디션 생성</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <XMarkIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="px-6 pb-6 space-y-5">
          <p className="text-sm text-gray-500">
            에디션에 BIVE를 등록 후 통합 관리합니다. 에디션 명칭은 등록된 BIVE가 없을때 수정이 가능합니다.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">한국어</label>
            <input
              value={ko}
              onChange={(e) => setKo(e.target.value)}
              placeholder="에디션명 입력"
              className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">영어</label>
            <input
              value={en}
              onChange={(e) => setEn(e.target.value)}
              placeholder="에디션명 입력"
              className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">일본어</label>
            <input
              value={jp}
              onChange={(e) => setJp(e.target.value)}
              placeholder="에디션명 입력"
              className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            disabled={!canSubmit}
            onClick={() => {
              alert(`[Mock] 에디션 생성\nKO: ${ko}`);
              onClose();
            }}
            className="w-full h-12 rounded-lg text-sm font-semibold text-white bg-indigo-400 hover:bg-indigo-500 disabled:bg-indigo-200"
          >
            생성하기
          </button>
        </div>
      </div>
    </div>
  );
}
