'use client';

import { useState } from 'react';
import CreateModal from '@/components/clone/CreateModal';

type Lang = 'ko' | 'en' | 'jp';

export default function CreateGroupModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState({ ko: '', en: '', jp: '' });
  const [desc, setDesc] = useState({ ko: '', en: '', jp: '' });
  const [lang, setLang] = useState<Lang>('ko');
  const [sns, setSns] = useState({ instagram: '', twitter: '', youtube: '', tiktok: '', homepage: '' });

  const canSubmit = name.ko.trim().length > 0;

  return (
    <CreateModal
      isOpen={isOpen}
      onClose={onClose}
      title="그룹 생성"
      width="max-w-2xl"
      disabled={!canSubmit}
      onSubmit={() => {
        alert(`[Mock] 그룹 생성\n이름: ${name.ko}\n설명: ${desc.ko.slice(0, 60)}`);
        onClose();
      }}
      submitLabel="생성하기"
    >
      {/* 그룹명 */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          그룹명 <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-3 mb-2">
          {(['ko', 'en', 'jp'] as Lang[]).map((l) => (
            <label key={l} className="inline-flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="name-lang" checked={lang === l} onChange={() => setLang(l)} className="text-indigo-600" />
              <span className="text-sm text-gray-700">{l === 'ko' ? '한국어' : l === 'en' ? '영어' : '일본어'}</span>
            </label>
          ))}
        </div>
        <input
          value={name[lang]}
          onChange={(e) => setName({ ...name, [lang]: e.target.value.slice(0, 30) })}
          placeholder="그룹명 입력"
          className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* 로고·메인 이미지 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">로고</label>
          <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm cursor-pointer hover:border-indigo-300">
            + 업로드
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">메인 이미지</label>
          <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm cursor-pointer hover:border-indigo-300">
            + 업로드
          </div>
        </div>
      </div>

      {/* 그룹 소개 (다국어) */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">그룹 소개</label>
        <textarea
          value={desc[lang]}
          onChange={(e) => setDesc({ ...desc, [lang]: e.target.value })}
          rows={4}
          placeholder={`${lang === 'ko' ? '한국어' : lang === 'en' ? '영어' : '일본어'} 그룹 소개 입력`}
          className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex items-center gap-1.5 mt-2">
          {(['ko', 'en', 'jp'] as Lang[]).map((l) => (
            <span
              key={l}
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                desc[l] ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {l === 'ko' ? 'KO' : l === 'en' ? 'EN' : 'JA'}
            </span>
          ))}
        </div>
      </div>

      {/* SNS & Link */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">SNS & Link</label>
        <div className="space-y-2">
          {(Object.keys(sns) as (keyof typeof sns)[]).map((k) => (
            <input
              key={k}
              value={sns[k]}
              onChange={(e) => setSns({ ...sns, [k]: e.target.value })}
              placeholder={k.charAt(0).toUpperCase() + k.slice(1)}
              className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ))}
        </div>
      </div>
    </CreateModal>
  );
}
