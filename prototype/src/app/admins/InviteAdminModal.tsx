'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { roles } from '@/mock/admins';

export default function InviteAdminModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Super Admin');

  if (!isOpen) return null;

  const canSubmit = name.trim().length > 0 && /\S+@\S+\.\S+/.test(email);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">새 관리자 초대</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <XMarkIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="px-6 pb-2 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              관리자명 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 25))}
                placeholder="관리자명 입력"
                className="w-full h-11 pl-3 pr-14 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{name.length}/25</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              이메일 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 입력"
              className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              관리자 권한 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm appearance-none bg-white"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
              <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 mt-2">
          <button onClick={onClose} className="h-10 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
            취소하기
          </button>
          <button
            disabled={!canSubmit}
            onClick={() => {
              alert(`[Mock] 초대 발송\n${name} <${email}> · ${role}`);
              onClose();
            }}
            className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            초대하기
          </button>
        </div>
      </div>
    </div>
  );
}
