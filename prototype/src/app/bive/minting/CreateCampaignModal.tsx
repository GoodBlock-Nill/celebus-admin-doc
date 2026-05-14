'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';

export default function CreateCampaignModal({ isOpen, onClose, type = 'EVENT' }: { isOpen: boolean; onClose: () => void; type?: 'EVENT' | 'TICKET' | 'MIX' | 'PICK' }) {
  const [tab, setTab] = useState<'info' | 'bive'>('info');
  const [name, setName] = useState('');
  const [linked, setLinked] = useState('');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">{type.charAt(0) + type.slice(1).toLowerCase()} 캠페인 생성</h3>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="h-9 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              취소하기
            </button>
            <button
              disabled={!name.trim() || !linked}
              onClick={() => {
                alert(`[Mock] 캠페인 생성\n${name}`);
                onClose();
              }}
              className="h-9 px-4 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              생성하기
            </button>
            <button onClick={onClose} className="ml-2 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
              <XMarkIcon className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="border-b border-gray-100 px-6">
          <div className="flex gap-0">
            {([['info', '기본정보'], ['bive', 'BIVE 보상']] as const).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${tab === k ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5">
          {tab === 'info' ? (
            <>
              <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg text-sm">
                캠페인 식별을 위한 캠페인 명을 입력하고, 연결기능을 선택해 주세요.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">캠페인 명</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="캠페인 명을 입력하세요"
                  className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">연결 기능</label>
                <div className="relative">
                  <select
                    value={linked}
                    onChange={(e) => setLinked(e.target.value)}
                    className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm appearance-none bg-white"
                  >
                    <option value="">연결 기능을 선택해주세요</option>
                    <option value="회원가입 보상">회원가입 보상</option>
                    <option value="팬퀘스트 보상">팬퀘스트 보상</option>
                  </select>
                  <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-sm text-gray-500">
              캠페인 생성 후 BIVE 보상을 추가할 수 있습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
