'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { sidebarMenuList } from '@/mock/admins';

type Permissions = Record<string, { read: boolean; write: boolean; delete: boolean }>;

export default function CreateRoleModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [perms, setPerms] = useState<Permissions>(() => {
    const init: Permissions = {};
    sidebarMenuList.forEach((m) => { init[m] = { read: false, write: false, delete: false }; });
    return init;
  });

  if (!isOpen) return null;

  const toggle = (menu: string, key: 'read' | 'write' | 'delete') => {
    setPerms({ ...perms, [menu]: { ...perms[menu], [key]: !perms[menu][key] } });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">권한 생성</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <XMarkIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              권한명 <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="권한명을 입력하세요"
              className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">권한설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="권한에 대한 설명을 입력하세요"
              className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none"
            />
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">권한 설정 (초기값)</h4>
            <div className="bg-amber-50 text-amber-700 px-4 py-2.5 rounded-lg text-sm mb-3">
              권한 그룹 생성 후 상세 페이지에서 메뉴별 권한을 설정할 수 있습니다.
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_70px_70px_70px] bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-600 border-b border-gray-200">
                <div>대메뉴</div>
                <div className="text-center">읽기</div>
                <div className="text-center">쓰기</div>
                <div className="text-center">삭제</div>
              </div>
              {sidebarMenuList.map((m) => (
                <div key={m} className="grid grid-cols-[1fr_70px_70px_70px] px-4 py-2.5 text-sm border-b border-gray-100 last:border-b-0">
                  <div className="text-gray-700">{m}</div>
                  {(['read', 'write', 'delete'] as const).map((k) => (
                    <div key={k} className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={perms[m][k]}
                        onChange={() => toggle(m, k)}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            취소
          </button>
          <button
            disabled={!name.trim()}
            onClick={() => {
              alert(`[Mock] 권한 생성\n${name}`);
              onClose();
            }}
            className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            생성
          </button>
        </div>
      </div>
    </div>
  );
}
