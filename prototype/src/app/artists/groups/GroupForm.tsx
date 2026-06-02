'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/layout/Breadcrumb';
import ConfirmModal from '@/components/clone/ConfirmModal';
import ImageUpload from '@/components/clone/ImageUpload';
import { toast } from '@/components/ui/Toast';
import type { ArtistGroup } from '@/mock/artists';

type Lang = 'ko' | 'en' | 'jp';
const LANGS: { key: Lang; label: string }[] = [
  { key: 'ko', label: 'KO' },
  { key: 'en', label: 'EN' },
  { key: 'jp', label: 'JA' },
];
const SNS = [
  { key: 'instagram', label: 'Instagram', color: 'bg-gradient-to-br from-amber-400 via-rose-500 to-fuchsia-600' },
  { key: 'twitter', label: 'X', color: 'bg-black' },
  { key: 'youtube', label: 'YouTube', color: 'bg-red-600' },
  { key: 'tiktok', label: 'TikTok', color: 'bg-black' },
  { key: 'homepage', label: 'Homepage', color: 'bg-gray-400' },
] as const;

type SnsKey = (typeof SNS)[number]['key'];

const isValidUrl = (v: string) => {
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

export default function GroupForm({ mode, group }: { mode: 'create' | 'edit'; group?: ArtistGroup }) {
  const router = useRouter();

  const initial = useMemo(() => ({
    name: { ko: group?.nameKO ?? group?.name ?? '', en: group?.nameEN ?? '', jp: group?.nameJP ?? '' },
    desc: { ko: group?.descriptionKO ?? group?.description ?? '', en: group?.descriptionEN ?? '', jp: group?.descriptionJP ?? '' },
    logo: group?.logoSrc ?? '',
    banner: group?.mainImageSrc ?? '',
    sns: {
      instagram: group?.sns?.instagram ?? '',
      twitter: group?.sns?.twitter ?? '',
      youtube: group?.sns?.youtube ?? '',
      tiktok: group?.sns?.tiktok ?? '',
      homepage: group?.sns?.homepage ?? '',
    },
  }), [group]);

  const [name, setName] = useState(initial.name);
  const [desc, setDesc] = useState(initial.desc);
  const [logo, setLogo] = useState(initial.logo);
  const [banner, setBanner] = useState(initial.banner);
  const [sns, setSns] = useState(initial.sns);
  const [nameLang, setNameLang] = useState<Lang>('ko');
  const [descLang, setDescLang] = useState<Lang>('ko');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // 다국어 입력 상태
  const nameFilled = Boolean(name.ko && name.en && name.jp);
  const namePartial = Boolean((name.ko || name.en || name.jp) && !nameFilled);
  const descFilled = Boolean(desc.ko && desc.en && desc.jp);
  const descPartial = Boolean((desc.ko || desc.en || desc.jp) && !descFilled);

  // SNS/홈페이지 URL 유효성 (비어있으면 통과)
  const invalidUrlKeys = useMemo(
    () => SNS.map((s) => s.key).filter((k) => sns[k].trim() !== '' && !isValidUrl(sns[k].trim())),
    [sns]
  );

  const allRequiredMet = nameFilled && descFilled && Boolean(logo) && Boolean(banner) && invalidUrlKeys.length === 0;

  // 변경 여부 (수정 모드 [수정하기] 활성 조건)
  const isDirty = useMemo(() => {
    const eq = (a: Record<Lang, string>, b: Record<Lang, string>) => a.ko === b.ko && a.en === b.en && a.jp === b.jp;
    const snsEq = SNS.every((s) => sns[s.key] === initial.sns[s.key]);
    return !eq(name, initial.name) || !eq(desc, initial.desc) || logo !== initial.logo || banner !== initial.banner || !snsEq;
  }, [name, desc, logo, banner, sns, initial]);

  const canSubmit = mode === 'create' ? allRequiredMet : isDirty && allRequiredMet;

  const back = () => router.push(group ? `/artists/groups/${group.id}?tab=info` : '/artists/groups');

  const handleSubmitClick = () => {
    setShowErrors(true);
    if (!allRequiredMet) return;
    if (mode === 'edit' && !isDirty) return;
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    if (mode === 'create') {
      toast.success('그룹을 생성했습니다.');
      router.push('/artists/groups');
    } else {
      toast.success('그룹 정보를 수정했습니다.');
      back();
    }
  };

  const tabBtns = (active: Lang, set: (l: Lang) => void, vals: Record<Lang, string>) => (
    <div className="flex items-center gap-1.5 mb-2">
      {LANGS.map((l) => (
        <button
          key={l.key}
          type="button"
          onClick={() => set(l.key)}
          className={`inline-flex items-center gap-1 px-3 h-7 rounded-md text-xs font-medium ${active === l.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          {l.label}
          {!vals[l.key] && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <Breadcrumb customItems={
          mode === 'create'
            ? [{ label: '아티스트' }, { label: '그룹 리스트', href: '/artists/groups' }, { label: '그룹 생성' }]
            : [{ label: '아티스트' }, { label: '그룹리스트', href: '/artists/groups' }, { label: '그룹 상세', href: `/artists/groups/${group?.id}?tab=info` }, { label: '그룹 수정' }]
        } />
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-[28px] font-bold text-gray-900">{mode === 'create' ? '그룹 생성' : '그룹 수정'}</h1>
          <div className="flex gap-2">
            <button onClick={() => setCancelOpen(true)} className="h-10 px-4 text-sm font-medium text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100">취소하기</button>
            <button
              disabled={!canSubmit}
              onClick={handleSubmitClick}
              className="h-10 px-4 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
            >{mode === 'create' ? '생성하기' : '수정하기'}</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-5">
        {/* 좌측: 이름·소개·이미지 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2"><span className="text-red-500">*</span> 그룹명</label>
            {tabBtns(nameLang, setNameLang, name)}
            <input
              value={name[nameLang]}
              onChange={(e) => setName({ ...name, [nameLang]: e.target.value.slice(0, 100) })}
              placeholder="그룹명을 입력하세요"
              className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="mt-1 text-right text-xs text-gray-400">{name[nameLang].length}/100</div>
            {showErrors && !name.ko && !name.en && !name.jp && <p className="text-xs text-red-500 mt-1">필수 입력 항목입니다.</p>}
            {showErrors && namePartial && <p className="text-xs text-red-500 mt-1">한국어·영어·일본어를 모두 입력하세요.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2"><span className="text-red-500">*</span> 그룹소개</label>
            {tabBtns(descLang, setDescLang, desc)}
            <textarea
              value={desc[descLang]}
              onChange={(e) => setDesc({ ...desc, [descLang]: e.target.value.slice(0, 500) })}
              rows={5}
              placeholder="그룹소개를 입력하세요"
              className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="mt-1 text-right text-xs text-gray-400">{desc[descLang].length}/500</div>
            {showErrors && !desc.ko && !desc.en && !desc.jp && <p className="text-xs text-red-500 mt-1">필수 입력 항목입니다.</p>}
            {showErrors && descPartial && <p className="text-xs text-red-500 mt-1">한국어·영어·일본어를 모두 입력하세요.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">로고(심볼) <span className="text-red-500">*</span></label>
            <p className="text-xs text-gray-400 mb-2">권장: 512×512px (1:1) · JPG·PNG·WebP (최대 5MB)</p>
            <ImageUpload value={logo} onChange={setLogo} ratio="1/1" required mode={mode} />
            {showErrors && !logo && <p className="text-xs text-red-500 mt-1">필수 입력 항목입니다.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">대표이미지(배너) <span className="text-red-500">*</span></label>
            <p className="text-xs text-gray-400 mb-2">권장: 1920×1080px (16:9) · JPG·PNG·WebP (최대 5MB)</p>
            <ImageUpload value={banner} onChange={setBanner} ratio="16/9" required mode={mode} />
            {showErrors && !banner && <p className="text-xs text-red-500 mt-1">필수 입력 항목입니다.</p>}
          </div>
        </div>

        {/* 우측: SNS */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          {SNS.map((s) => {
            const key = s.key as SnsKey;
            const invalid = showErrors && invalidUrlKeys.includes(key);
            return (
              <div key={s.key}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-5 h-5 rounded-md ${s.color} flex items-center justify-center text-[10px] font-bold text-white`}>{s.label[0]}</span>
                  <span className="text-sm font-semibold text-gray-900">{s.label}</span>
                </div>
                <input
                  value={sns[key]}
                  onChange={(e) => setSns({ ...sns, [key]: e.target.value })}
                  placeholder="URL 입력 (예: https://...)"
                  className={`w-full h-11 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${invalid ? 'border-red-400' : 'border-gray-200'}`}
                />
                {invalid && <p className="text-xs text-red-500 mt-1">올바른 URL 형식이 아닙니다.</p>}
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        title={mode === 'create' ? '그룹 생성' : '그룹 수정'}
        lines={mode === 'create'
          ? ['확인 버튼을 누르면 그룹이 생성됩니다', '계속 진행하시겠습니까?']
          : ['확인 버튼을 누르면 수정사항이 적용됩니다', '계속 진행하시겠습니까?']}
      />
      <ConfirmModal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => { setCancelOpen(false); back(); }}
        title={mode === 'create' ? '그룹 생성 취소' : '그룹 수정 취소'}
        lines={mode === 'create'
          ? ['작성중인 내용이 사라집니다', '취소하시겠습니까?']
          : ['수정된 데이터는 저장되지 않습니다', '계속 진행하시겠습니까?']}
      />
    </div>
  );
}
