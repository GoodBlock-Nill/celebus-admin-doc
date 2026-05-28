'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon, PlusIcon, XMarkIcon } from '@heroicons/react/20/solid';
import Breadcrumb from '@/components/layout/Breadcrumb';
import MediaDropzone from '@/components/clone/MediaDropzone';
import ConfirmModal from '@/components/clone/ConfirmModal';
import AddressSearch from '@/components/clone/AddressSearch';
import { LangField, LangTextarea, isAllLangsFilled, type Lang } from '@/components/clone/LangField';
import { toast } from '@/components/ui/Toast';
import { FEED_GROUPS, CONTENT_PLATFORMS, type FeedItem, type FeedType, type RelatedContent, type ContentPlatform, type ML } from '@/mock/feed';

const TYPES: FeedType[] = ['소식', '일정', '공지'];
const emptyML: ML = { KO: '', EN: '', JA: '' };

export default function FeedForm({ mode, initial }: { mode: 'create' | 'edit'; initial?: FeedItem }) {
  const router = useRouter();

  const [type, setType] = useState<FeedType>(initial?.type ?? '소식');
  const [groupName, setGroupName] = useState(initial?.groupName ?? FEED_GROUPS[0]);
  const [official, setOfficial] = useState(initial?.official ?? false);
  const [titleLang, setTitleLang] = useState<Lang>('KO');
  const [title, setTitle] = useState<ML>(initial?.title ?? { ...emptyML });
  const [bodyLang, setBodyLang] = useState<Lang>('KO');
  const [body, setBody] = useState<ML>(initial?.body ?? { ...emptyML });
  const [date, setDate] = useState(initial?.date?.replace(/\./g, '-') ?? '');
  const [time, setTime] = useState(initial?.time ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [cover, setCover] = useState(initial?.coverImage ?? '');
  const [contents, setContents] = useState<RelatedContent[]>(initial?.relatedContents ?? []);
  const [ctaLabel, setCtaLabel] = useState(initial?.ctaLabel ?? '');
  const [ctaUrl, setCtaUrl] = useState(initial?.ctaUrl ?? '');

  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const addImage = (f: string) => { if (f && images.length < 10) setImages([...images, f]); };
  const removeImage = (i: number) => setImages(images.filter((_, idx) => idx !== i));
  const addContent = () => { if (contents.length < 3) setContents([...contents, { platform: '유튜브', name: '', url: '' }]); };
  const updateContent = (i: number, key: keyof RelatedContent, v: string) =>
    setContents(contents.map((c, idx) => (idx === i ? { ...c, [key]: v } : c)));
  const removeContent = (i: number) => setContents(contents.filter((_, idx) => idx !== i));

  // 게시 필수 검증 — 다국어 필수 + 타입별 필수
  const canPublish = type === '일정'
    ? isAllLangsFilled(title) && !!date && !!time
    : isAllLangsFilled(title) && isAllLangsFilled(body) && !!date;

  const backTo = () => router.push(mode === 'edit' && initial ? `/artists/feed/${initial.id}` : '/artists/feed');

  const draft = () => { toast.success(`${type} '${title.KO || '제목 없음'}'을(를) 임시저장했습니다.`); backTo(); };
  const onPublishClick = () => {
    if (!canPublish) { toast.error('한국어·영어·일본어를 모두 입력해야 게시할 수 있습니다.'); return; }
    setPublishOpen(true);
  };
  const publish = () => { toast.success(`${type} '${title.KO || '제목 없음'}'을(를) 게시했습니다.`); backTo(); };

  const titleLabel = type === '일정' ? '일정명' : '제목';

  return (
    <div>
      <div className="mb-6">
        <Breadcrumb customItems={[{ label: '아티스트' }, { label: '소식/일정', href: '/artists/feed' }, { label: mode === 'create' ? '작성' : `${initial?.title.KO ?? ''} 수정` }]} />
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-[28px] font-bold text-gray-900">{mode === 'create' ? '소식/일정 작성' : '소식/일정 수정'}</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setCancelOpen(true)} className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
            {mode === 'edit' && <button onClick={() => setDeleteOpen(true)} className="h-10 px-4 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">삭제</button>}
            <button onClick={draft} className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">임시저장</button>
            <button
              onClick={onPublishClick}
              disabled={!canPublish}
              title={canPublish ? '' : '한국어·영어·일본어 필수 항목을 모두 입력해야 게시할 수 있습니다.'}
              className={`h-10 px-4 text-sm font-medium rounded-lg ${canPublish ? 'text-white bg-indigo-600 hover:bg-indigo-700' : 'text-white bg-gray-300 cursor-not-allowed'}`}
            >게시</button>
          </div>
        </div>
        {!canPublish && <p className="mt-2 text-xs text-amber-600">게시하려면 제목{type !== '일정' ? '·본문' : ''}의 한국어·영어·일본어와 {type === '일정' ? '일시' : '게시일'}를 모두 입력하세요. (임시저장은 가능)</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* 본문 영역 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-5">
          <LangField label={titleLabel} required lang={titleLang} onLangChange={setTitleLang} value={title[titleLang]} onChange={(v) => setTitle({ ...title, [titleLang]: v })} values={title} maxLength={50} placeholder={`${titleLabel} 입력`} />

          {type === '일정' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">날짜 <span className="text-red-500">*</span></label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">시간 <span className="text-red-500">*</span></label>
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">장소 <span className="text-gray-400 font-normal">(구글 장소 검색)</span></label>
                <AddressSearch value={location} onChange={setLocation} />
              </div>
            </>
          )}

          {(type === '소식' || type === '공지') && (
            <>
              <LangTextarea label="본문" required rows={8} lang={bodyLang} onLangChange={setBodyLang} value={body[bodyLang]} onChange={(v) => setBody({ ...body, [bodyLang]: v })} values={body} maxLength={5000} placeholder="본문 입력 (위지윅)" />
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">게시일 <span className="text-red-500">*</span></label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </>
          )}

          {type === '소식' && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">이미지 <span className="text-gray-400 font-normal">(최대 10장)</span></label>
              <div className="flex flex-wrap items-start gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative w-[120px] h-[120px] rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center p-2 text-center">
                    <span className="text-xs text-gray-600 break-all">{img}</span>
                    <button type="button" onClick={() => removeImage(i)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center"><XMarkIcon className="w-3 h-3" /></button>
                  </div>
                ))}
                {images.length < 10 && (
                  <div className="w-[120px] h-[120px]"><MediaDropzone value="" onChange={addImage} acceptLabel="PNG, JPG, WebP" accept=".png,.jpg,.jpeg,.webp" emptyLabel="이미지 추가" /></div>
                )}
              </div>
            </div>
          )}

          {type === '소식' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-900">연관 콘텐츠 <span className="text-gray-400 font-normal">(최대 3건)</span></label>
                <button type="button" onClick={addContent} disabled={contents.length >= 3} className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 disabled:text-gray-300">
                  <PlusIcon className="w-4 h-4" />콘텐츠 추가
                </button>
              </div>
              <div className="space-y-2">
                {contents.length === 0 && <p className="text-xs text-gray-400">등록된 연관 콘텐츠가 없습니다.</p>}
                {contents.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="relative">
                      <select value={c.platform} onChange={(e) => updateContent(i, 'platform', e.target.value as ContentPlatform)} className="h-10 pl-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[110px] focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {CONTENT_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <ChevronUpDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <input value={c.name} onChange={(e) => updateContent(i, 'name', e.target.value)} placeholder="콘텐츠명" className="w-[200px] h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <input value={c.url} onChange={(e) => updateContent(i, 'url', e.target.value)} placeholder="https://" className="flex-1 h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <button type="button" onClick={() => removeContent(i)} className="p-1.5 text-gray-400 hover:text-red-500"><XMarkIcon className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {type === '공지' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">대표 이미지 <span className="text-gray-400 font-normal">(선택)</span></label>
                <div className="max-w-[200px]"><MediaDropzone value={cover} onChange={setCover} acceptLabel="PNG, JPG, WebP" accept=".png,.jpg,.jpeg,.webp" emptyLabel="대표 이미지" /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">CTA 버튼 <span className="text-gray-400 font-normal">(선택)</span></label>
                <div className="flex items-center gap-2">
                  <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} maxLength={30} placeholder="버튼 라벨 (예: 좌석 배치도 확인하기)" className="w-[260px] h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://" className="flex-1 h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* 메타 사이드 */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4 h-fit">
          <h2 className="text-base font-bold text-gray-900">설정</h2>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">타입</label>
            <div className="relative">
              <select value={type} onChange={(e) => setType(e.target.value as FeedType)} className="w-full h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">연결 아티스트</label>
            <div className="relative">
              <select value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {FEED_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          {type !== '공지' && (
            <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-gray-900">공식 출처</p>
                <p className="text-xs text-gray-500">공식 제공 뱃지 표기</p>
              </div>
              <button onClick={() => setOfficial(!official)} role="switch" aria-checked={official} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${official ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${official ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={backTo} title="작성을 취소할까요?" lines={['작성 중인 내용은 저장되지 않습니다.']} confirmLabel="나가기" />
      <ConfirmModal isOpen={publishOpen} onClose={() => setPublishOpen(false)} onConfirm={publish} title="게시할까요?" lines={['게시 즉시 앱 정보 피드에 노출됩니다.']} confirmLabel="게시" />
      <ConfirmModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={() => { toast.success(`${type} '${initial?.title.KO ?? ''}'을(를) 삭제했습니다.`); router.push('/artists/feed'); }} title="삭제할까요?" lines={['삭제한 콘텐츠는 복구할 수 없습니다.']} confirmLabel="삭제" />
    </div>
  );
}
