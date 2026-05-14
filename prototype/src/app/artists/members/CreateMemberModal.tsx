'use client';

import { useState } from 'react';
import CreateModal from '@/components/clone/CreateModal';

type Lang = 'ko' | 'en' | 'jp';

export default function CreateMemberModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState({ ko: '', en: '', jp: '' });
  const [lang, setLang] = useState<Lang>('ko');
  const [agency, setAgency] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState<'여자' | '남자'>('여자');
  const [height, setHeight] = useState('');
  const [intro, setIntro] = useState({ ko: '', en: '', jp: '' });

  const canSubmit = name.ko.trim().length > 0 && birthday.trim().length > 0;

  return (
    <CreateModal
      isOpen={isOpen}
      onClose={onClose}
      title="멤버 생성"
      width="max-w-2xl"
      disabled={!canSubmit}
      onSubmit={() => {
        alert(`[Mock] 멤버 생성\n이름: ${name.ko} / 생년월일: ${birthday}`);
        onClose();
      }}
      submitLabel="생성하기"
    >
      {/* 프로필 이미지 */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">프로필 이미지</label>
        <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm cursor-pointer hover:border-indigo-300">
          + 업로드
        </div>
      </div>

      {/* 멤버명 */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          멤버명 <span className="text-red-500">*</span>
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
          placeholder="멤버명 입력"
          className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* 기본정보 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">소속사</label>
          <input
            value={agency}
            onChange={(e) => setAgency(e.target.value)}
            placeholder="소속사 (선택)"
            className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            생년월일 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">성별</label>
          <div className="flex gap-2">
            {(['여자', '남자'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`flex-1 h-10 rounded-lg border text-sm font-medium ${
                  gender === g ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-700'
                }`}
              >{g}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">키 (cm)</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="161"
            className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* 멤버 소개 */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">멤버 소개</label>
        <textarea
          value={intro[lang]}
          onChange={(e) => setIntro({ ...intro, [lang]: e.target.value })}
          rows={3}
          placeholder={`${lang === 'ko' ? '한국어' : lang === 'en' ? '영어' : '일본어'} 멤버 소개 입력`}
          className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </CreateModal>
  );
}
