'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { CalendarDaysIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import Breadcrumb from '@/components/layout/Breadcrumb';
import ConfirmModal from '@/components/clone/ConfirmModal';
import { artistAgencies, type ArtistMember } from '@/mock/artists';

type Lang = 'ko' | 'en' | 'jp';
const LANGS: { key: Lang; label: string }[] = [
  { key: 'ko', label: 'KO' },
  { key: 'en', label: 'EN' },
  { key: 'jp', label: 'JA' },
];

function getZodiac(birthday: string): string {
  const m = birthday.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (!m) return '';
  const month = parseInt(m[2], 10), day = parseInt(m[3], 10);
  const z: [number, number, string][] = [
    [1, 20, '염소자리'], [2, 19, '물병자리'], [3, 21, '물고기자리'], [4, 20, '양자리'],
    [5, 21, '황소자리'], [6, 22, '쌍둥이자리'], [7, 23, '게자리'], [8, 23, '사자자리'],
    [9, 23, '처녀자리'], [10, 23, '천칭자리'], [11, 22, '전갈자리'], [12, 22, '사수자리'],
  ];
  if (month < 1 || month > 12) return '';
  const [, cutoff, sign] = z[month - 1];
  if (day < cutoff) return sign;
  return month === 12 ? '염소자리' : z[month][2];
}

export default function MemberForm({ mode, member }: { mode: 'create' | 'edit'; member?: ArtistMember }) {
  const router = useRouter();
  const [name, setName] = useState({ ko: member?.nameKO ?? member?.name ?? '', en: member?.nameEN ?? '', jp: member?.nameJP ?? '' });
  const [nameLang, setNameLang] = useState<Lang>('ko');
  const [birthday, setBirthday] = useState(member?.birthday ?? '');
  const [height, setHeight] = useState(member?.heightCm ? String(member.heightCm) : '');
  const [weight, setWeight] = useState(member?.weightKg ? String(member.weightKg) : '');
  const [agency, setAgency] = useState(member?.agency ?? '소속사 없음');
  const [gender, setGender] = useState(member?.gender ?? '');
  const [intro, setIntro] = useState({ ko: member?.introKO ?? '', en: member?.introEN ?? '', jp: member?.introJP ?? '' });
  const [greeting, setGreeting] = useState({ ko: member?.greetingKO ?? '', en: member?.greetingEN ?? '', jp: member?.greetingJP ?? '' });
  const [hobby, setHobby] = useState({ ko: member?.hobbyKO ?? '', en: member?.hobbyEN ?? '', jp: member?.hobbyJP ?? '' });
  const [motto, setMotto] = useState({ ko: member?.mottoKO ?? '', en: member?.mottoEN ?? '', jp: member?.mottoJP ?? '' });
  const [introLang, setIntroLang] = useState<Lang>('ko');
  const [greetLang, setGreetLang] = useState<Lang>('ko');
  const [hobbyLang, setHobbyLang] = useState<Lang>('ko');
  const [mottoLang, setMottoLang] = useState<Lang>('ko');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const zodiac = getZodiac(birthday);
  const canSubmit = mode === 'edit' ? true : Boolean(name.ko && name.en && name.jp && birthday && height && gender);
  const back = () => router.push(member ? `/artists/members/${member.id}?tab=info` : '/artists/members');

  const tabBtns = (active: Lang, set: (l: Lang) => void, vals: Record<Lang, string>) => (
    <div className="flex items-center gap-1.5 mb-2">
      {LANGS.map((l) => (
        <button key={l.key} type="button" onClick={() => set(l.key)}
          className={`inline-flex items-center gap-1 px-3 h-7 rounded-md text-xs font-medium ${active === l.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
          {l.label}{!vals[l.key] && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
        </button>
      ))}
    </div>
  );

  const langTextarea = (
    label: string, max: number, active: Lang, set: (l: Lang) => void,
    vals: { ko: string; en: string; jp: string }, setVals: (v: { ko: string; en: string; jp: string }) => void,
    placeholder: string, required = false,
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-2">{required && <span className="text-red-500">*</span>} {label}</label>
      {tabBtns(active, set, vals)}
      <textarea value={vals[active]} onChange={(e) => setVals({ ...vals, [active]: e.target.value.slice(0, max) })} rows={3} placeholder={placeholder}
        className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      <div className="mt-1 text-right text-xs text-gray-400">{vals[active].length}/{max}</div>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <Breadcrumb customItems={
          mode === 'create'
            ? [{ label: '아티스트' }, { label: '멤버 리스트', href: '/artists/members' }, { label: '멤버 생성' }]
            : [{ label: '아티스트' }, { label: '멤버 리스트', href: '/artists/members' }, { label: '멤버 상세', href: `/artists/members/${member?.id}?tab=info` }, { label: '멤버 수정' }]
        } />
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-[28px] font-bold text-gray-900">{mode === 'create' ? '멤버 생성' : '멤버 수정'}</h1>
          <div className="flex gap-2">
            <button onClick={() => setCancelOpen(true)} className="h-10 px-4 text-sm font-medium text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100">취소하기</button>
            <button disabled={!canSubmit} onClick={() => setConfirmOpen(true)}
              className="h-10 px-4 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300">{mode === 'create' ? '생성하기' : '수정하기'}</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* 좌측 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2"><span className="text-red-500">*</span> 멤버명</label>
            {tabBtns(nameLang, setNameLang, name)}
            <input value={name[nameLang]} onChange={(e) => setName({ ...name, [nameLang]: e.target.value.slice(0, 100) })} placeholder="멤버명을 입력하세요"
              className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <div className="mt-1 text-right text-xs text-gray-400">{name[nameLang].length}/100</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">프로필이미지 <span className="text-red-500">*</span></label>
            <div className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl px-4 py-5 cursor-pointer hover:border-indigo-300">
              <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center"><ArrowUpTrayIcon className="w-5 h-5 text-gray-400" /></div>
              <div>
                <p className="text-sm text-gray-700">{member?.profileImageSrc ? '기존 이미지 · 변경하려면 클릭' : '클릭하거나 파일을 드래그하세요'}</p>
                <p className="text-xs text-gray-400 mt-0.5">프로필 이미지 (1:1 비율) · jpeg, png, jpg, webp, gif, svg (최대 5MB)</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2"><span className="text-red-500">*</span> 생년월일</label>
              <div className="relative">
                <input value={birthday} onChange={(e) => setBirthday(e.target.value)} placeholder="YYYY.MM.DD"
                  className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <CalendarDaysIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">별자리</label>
              <div className="h-11 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 flex items-center">
                {zodiac || '생년월일 입력 시 자동 계산'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2"><span className="text-red-500">*</span> 키(cm)</label>
            <input value={height} onChange={(e) => setHeight(e.target.value.replace(/[^0-9]/g, ''))} placeholder="키 입력"
              className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">소속사</label>
              <div className="relative">
                <select value={agency} onChange={(e) => setAgency(e.target.value)}
                  className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {artistAgencies.map((a) => <option key={a.id} value={a.operatorName}>{a.operatorName}</option>)}
                </select>
                <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2"><span className="text-red-500">*</span> 성별</label>
              <div className="relative">
                <select value={gender} onChange={(e) => setGender(e.target.value)}
                  className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">성별 선택</option>
                  <option value="남자">남자</option>
                  <option value="여자">여자</option>
                </select>
                <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* 우측 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
          {langTextarea('멤버소개', 255, introLang, setIntroLang, intro, setIntro, '멤버소개를 입력하세요')}
          {langTextarea('인사말', 100, greetLang, setGreetLang, greeting, setGreeting, '인사말을 입력하세요')}
          {langTextarea('취미', 100, hobbyLang, setHobbyLang, hobby, setHobby, '취미를 입력하세요')}
          {langTextarea('좌우명', 100, mottoLang, setMottoLang, motto, setMotto, '좌우명을 입력하세요')}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">몸무게(kg)</label>
            <input value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^0-9]/g, ''))} placeholder="몸무게 입력"
              className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      </div>

      <ConfirmModal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={() => { setConfirmOpen(false); back(); }}
        title={mode === 'create' ? '멤버 생성' : '멤버 수정'}
        lines={mode === 'create' ? ['확인 버튼을 누르면 신규 멤버가 생성됩니다', '계속 진행하시겠습니까?'] : ['확인 버튼을 누르면 수정사항이 적용됩니다', '계속 진행하시겠습니까?']} />
      <ConfirmModal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={() => { setCancelOpen(false); back(); }}
        title={mode === 'create' ? '멤버 생성 취소' : '멤버 수정 취소'}
        lines={mode === 'create' ? ['입력된 데이터는 모두 사라집니다', '계속 진행하시겠습니까?'] : ['수정된 데이터는 저장되지 않습니다', '계속 진행하시겠습니까?']} />
    </div>
  );
}
