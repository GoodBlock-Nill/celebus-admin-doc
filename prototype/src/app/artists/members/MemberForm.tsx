'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import Breadcrumb from '@/components/layout/Breadcrumb';
import ConfirmModal from '@/components/clone/ConfirmModal';
import ImageUpload from '@/components/clone/ImageUpload';
import { toast } from '@/components/ui/Toast';
import { artistAgencies, type ArtistMember } from '@/mock/artists';

type Lang = 'ko' | 'en' | 'jp';
const LANGS: { key: Lang; label: string }[] = [
  { key: 'ko', label: 'KO' },
  { key: 'en', label: 'EN' },
  { key: 'jp', label: 'JA' },
];

type Gender = '' | '남성' | '여성';

// 키/몸무게 입력 허용 범위
const HEIGHT_MIN = 100;
const HEIGHT_MAX = 250;
const WEIGHT_MIN = 30;
const WEIGHT_MAX = 200;

// 생년월일 별자리 자동 산출 (운영자 수정 불가 — read-only)
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

// mock 저장 포맷(YYYY.MM.DD) ↔ <input type="date">(YYYY-MM-DD) 상호 변환
const toDateInput = (v: string) => (v ? v.replace(/\./g, '-') : '');
const todayInput = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

// 키/몸무게 단건 검증: 빈 값은 통과(선택), 값이 있으면 정수 + 범위 확인
function rangeError(raw: string, min: number, max: number, unit: 'cm' | 'kg'): string {
  if (!raw) return '';
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) {
    return `${min}~${max}${unit} 사이로 입력하세요.`;
  }
  return '';
}

export default function MemberForm({ mode, member }: { mode: 'create' | 'edit'; member?: ArtistMember }) {
  const router = useRouter();
  const initial = useMemo(
    () => ({
      name: { ko: member?.nameKO ?? member?.name ?? '', en: member?.nameEN ?? '', jp: member?.nameJP ?? '' },
      profileImage: member?.profileImageSrc ?? '',
      birthday: toDateInput(member?.birthday ?? ''),
      height: member?.heightCm ? String(member.heightCm) : '',
      weight: member?.weightKg ? String(member.weightKg) : '',
      agency: member?.agency ?? '소속사 없음',
      gender: (member?.gender ?? '') as Gender,
      intro: { ko: member?.introKO ?? '', en: member?.introEN ?? '', jp: member?.introJP ?? '' },
      greeting: { ko: member?.greetingKO ?? '', en: member?.greetingEN ?? '', jp: member?.greetingJP ?? '' },
      hobby: { ko: member?.hobbyKO ?? '', en: member?.hobbyEN ?? '', jp: member?.hobbyJP ?? '' },
      motto: { ko: member?.mottoKO ?? '', en: member?.mottoEN ?? '', jp: member?.mottoJP ?? '' },
    }),
    [member],
  );

  const [name, setName] = useState(initial.name);
  const [nameLang, setNameLang] = useState<Lang>('ko');
  const [profileImage, setProfileImage] = useState(initial.profileImage);
  const [birthday, setBirthday] = useState(initial.birthday);
  const [height, setHeight] = useState(initial.height);
  const [weight, setWeight] = useState(initial.weight);
  const [agency, setAgency] = useState(initial.agency);
  const [gender, setGender] = useState<Gender>(initial.gender);
  const [intro, setIntro] = useState(initial.intro);
  const [greeting, setGreeting] = useState(initial.greeting);
  const [hobby, setHobby] = useState(initial.hobby);
  const [motto, setMotto] = useState(initial.motto);
  const [introLang, setIntroLang] = useState<Lang>('ko');
  const [greetLang, setGreetLang] = useState<Lang>('ko');
  const [hobbyLang, setHobbyLang] = useState<Lang>('ko');
  const [mottoLang, setMottoLang] = useState<Lang>('ko');
  const [showErrors, setShowErrors] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  // 생년월일 → 별자리 자동 산출 (read-only)
  const zodiac = getZodiac(birthday);

  // 키/몸무게 인라인 에러
  const heightErr = rangeError(height, HEIGHT_MIN, HEIGHT_MAX, 'cm');
  const weightErr = rangeError(weight, WEIGHT_MIN, WEIGHT_MAX, 'kg');

  // 멤버명 다국어: 부분 입력 시 에러
  const nameFilled = Boolean(name.ko && name.en && name.jp);
  const nameTouched = Boolean(name.ko || name.en || name.jp);
  const nameError = !nameFilled
    ? nameTouched
      ? '한국어·영어·일본어를 모두 입력하세요.'
      : '필수 입력 항목입니다.'
    : '';

  // 소속사 드롭다운: 사용 상태만 노출. 운영자 노출명을 라벨/값으로 사용.
  const agencyOptions = useMemo(() => artistAgencies.filter((a) => a.status === '사용'), []);

  // 더티 추적 (edit 모드 [수정하기] 활성 제어)
  const isDirty = useMemo(() => {
    return (
      JSON.stringify(name) !== JSON.stringify(initial.name) ||
      profileImage !== initial.profileImage ||
      birthday !== initial.birthday ||
      height !== initial.height ||
      weight !== initial.weight ||
      agency !== initial.agency ||
      gender !== initial.gender ||
      JSON.stringify(intro) !== JSON.stringify(initial.intro) ||
      JSON.stringify(greeting) !== JSON.stringify(initial.greeting) ||
      JSON.stringify(hobby) !== JSON.stringify(initial.hobby) ||
      JSON.stringify(motto) !== JSON.stringify(initial.motto)
    );
  }, [name, profileImage, birthday, height, weight, agency, gender, intro, greeting, motto, hobby, initial]);

  // 필수 항목 충족 여부 (생성·수정 공통)
  const requiredOk =
    nameFilled && Boolean(profileImage) && Boolean(birthday) && Boolean(gender) && !heightErr && !weightErr;

  // 제출 버튼 활성: create=필수 충족 / edit=더티 + 필수 충족
  const canSubmit = mode === 'create' ? requiredOk : isDirty && requiredOk;

  const back = () => router.push(member ? `/artists/members/${member.id}?tab=info` : '/artists/members');

  const handleSubmit = () => {
    if (!requiredOk) {
      setShowErrors(true);
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    if (mode === 'create') {
      toast.success('멤버를 생성했습니다.');
      router.push('/artists/members');
    } else {
      toast.success('멤버 정보를 수정했습니다.');
      back();
    }
  };

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
    placeholder: string,
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-2">{label}</label>
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
            <button disabled={!canSubmit} onClick={handleSubmit}
              className="h-10 px-4 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed">{mode === 'create' ? '생성하기' : '수정하기'}</button>
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
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-red-500">{showErrors && nameError ? nameError : ''}</span>
              <span className="text-xs text-gray-400">{name[nameLang].length}/100</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">프로필이미지 <span className="text-red-500">*</span></label>
            <ImageUpload value={profileImage} onChange={setProfileImage} ratio="1/1" required mode={mode} />
            <p className="text-xs text-gray-400 mt-2">프로필 이미지 (1:1 비율) · JPG · PNG · WebP (최대 5MB)</p>
            {showErrors && !profileImage && <p className="text-xs text-red-500 mt-1">필수 입력 항목입니다.</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2"><span className="text-red-500">*</span> 생년월일</label>
              <input
                type="date"
                value={birthday}
                min="1900-01-01"
                max={todayInput()}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {showErrors && !birthday && <p className="text-xs text-red-500 mt-1">필수 입력 항목입니다.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">별자리</label>
              <div className="h-11 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 flex items-center">
                {zodiac || '생년월일 입력 시 자동 계산'}
              </div>
              <p className="text-xs text-gray-400 mt-1">생년월일 기준 자동 산출 (수정 불가)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">키(cm)</label>
              <input value={height} inputMode="numeric" onChange={(e) => setHeight(e.target.value.replace(/[^0-9]/g, ''))} placeholder="키 입력 (선택)"
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {heightErr && <p className="text-xs text-red-500 mt-1">{heightErr}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">몸무게(kg)</label>
              <input value={weight} inputMode="numeric" onChange={(e) => setWeight(e.target.value.replace(/[^0-9]/g, ''))} placeholder="몸무게 입력 (선택)"
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {weightErr && <p className="text-xs text-red-500 mt-1">{weightErr}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">소속사</label>
              <div className="relative">
                <select value={agency} onChange={(e) => setAgency(e.target.value)}
                  className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {agencyOptions.map((a) => <option key={a.id} value={a.operatorName}>{a.operatorName}</option>)}
                </select>
                <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2"><span className="text-red-500">*</span> 성별</label>
              <div className="relative">
                <select value={gender} onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">성별 선택</option>
                  <option value="남성">남성</option>
                  <option value="여성">여성</option>
                </select>
                <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {showErrors && !gender && <p className="text-xs text-red-500 mt-1">필수 입력 항목입니다.</p>}
            </div>
          </div>
        </div>

        {/* 우측 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
          {langTextarea('멤버소개', 255, introLang, setIntroLang, intro, setIntro, '멤버소개를 입력하세요')}
          {langTextarea('인사말', 100, greetLang, setGreetLang, greeting, setGreeting, '인사말을 입력하세요')}
          {langTextarea('취미', 100, hobbyLang, setHobbyLang, hobby, setHobby, '취미를 입력하세요')}
          {langTextarea('좌우명', 100, mottoLang, setMottoLang, motto, setMotto, '좌우명을 입력하세요')}
        </div>
      </div>

      <ConfirmModal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleConfirm}
        title={mode === 'create' ? '멤버 생성' : '멤버 수정'}
        lines={mode === 'create' ? ['확인 버튼을 누르면 신규 멤버가 생성됩니다', '계속 진행하시겠습니까?'] : ['확인 버튼을 누르면 수정사항이 적용됩니다', '계속 진행하시겠습니까?']} />
      <ConfirmModal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={() => { setCancelOpen(false); back(); }}
        title={mode === 'create' ? '멤버 생성 취소' : '멤버 수정 취소'}
        lines={mode === 'create' ? ['입력된 데이터는 모두 사라집니다', '계속 진행하시겠습니까?'] : ['수정된 데이터는 저장되지 않습니다', '계속 진행하시겠습니까?']} />
    </div>
  );
}
