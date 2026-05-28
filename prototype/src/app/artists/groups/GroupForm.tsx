'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import Breadcrumb from '@/components/layout/Breadcrumb';
import ConfirmModal from '@/components/clone/ConfirmModal';
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

export default function GroupForm({ mode, group }: { mode: 'create' | 'edit'; group?: ArtistGroup }) {
  const router = useRouter();
  const [name, setName] = useState({ ko: group?.nameKO ?? group?.name ?? '', en: group?.nameEN ?? '', jp: group?.nameJP ?? '' });
  const [desc, setDesc] = useState({ ko: group?.descriptionKO ?? group?.description ?? '', en: group?.descriptionEN ?? '', jp: group?.descriptionJP ?? '' });
  const [nameLang, setNameLang] = useState<Lang>('ko');
  const [descLang, setDescLang] = useState<Lang>('ko');
  const [sns, setSns] = useState({
    instagram: group?.sns?.instagram ?? '',
    twitter: group?.sns?.twitter ?? '',
    youtube: group?.sns?.youtube ?? '',
    tiktok: group?.sns?.tiktok ?? '',
    homepage: group?.sns?.homepage ?? '',
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const allName = name.ko && name.en && name.jp;
  const allDesc = desc.ko && desc.en && desc.jp;
  const canSubmit = mode === 'edit' ? true : Boolean(allName && allDesc);

  const back = () => router.push(group ? `/artists/groups/${group.id}?tab=info` : '/artists/groups');

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
              onClick={() => setConfirmOpen(true)}
              className="h-10 px-4 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
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
          </div>

          <Dropzone label="로고(심볼)" hint="권장: 512×512px (1:1) · jpeg, png, jpg, webp, gif, svg (최대 5MB)" filled={Boolean(group?.logoSrc)} />
          <Dropzone label="대표이미지(배너)" hint="권장: 1920×1080px (16:9) · jpeg, png, jpg, webp, gif, svg (최대 5MB)" filled={Boolean(group?.mainImageSrc)} />
        </div>

        {/* 우측: SNS */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          {SNS.map((s) => (
            <div key={s.key}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-5 h-5 rounded-md ${s.color} flex items-center justify-center text-[10px] font-bold text-white`}>{s.label[0]}</span>
                <span className="text-sm font-semibold text-gray-900">{s.label}</span>
              </div>
              <input
                value={sns[s.key as keyof typeof sns]}
                onChange={(e) => setSns({ ...sns, [s.key]: e.target.value })}
                placeholder="URL 입력"
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => { setConfirmOpen(false); back(); }}
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

function Dropzone({ label, hint, filled }: { label: string; hint: string; filled: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-2">{label} <span className="text-red-500">*</span></label>
      <div className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl px-4 py-5 cursor-pointer hover:border-indigo-300">
        <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center">
          <ArrowUpTrayIcon className="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <p className="text-sm text-gray-700">{filled ? '기존 이미지 · 변경하려면 클릭' : '클릭하거나 파일을 드래그하세요'}</p>
          <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
        </div>
      </div>
    </div>
  );
}
