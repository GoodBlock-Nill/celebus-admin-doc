'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftIcon, InformationCircleIcon, PhotoIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import { LangField, LangTextarea, isAllLangsFilled, type Lang } from '@/components/clone/LangField';
import {
  getGroupById,
  getMainEpisodesByGroupId,
  canAddMainEpisode,
  canAddRepeatEpisode,
  MAX_MAIN_EPISODES,
  REPEAT_EPISODE_DISPLAY_ORDER,
  type EpisodeKind,
} from '@/mock/sq';

type ArtistGroup = 'V01D' | 'iKON' | 'CELEBUS';

export default function SqCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupIdParam = searchParams.get('groupId');
  const kindParam = (searchParams.get('kind') ?? 'MAIN') as EpisodeKind;
  const groupId = groupIdParam ? parseInt(groupIdParam, 10) : null;
  const group = groupId ? getGroupById(groupId) : undefined;
  const episodeKind: EpisodeKind = kindParam === 'REPEAT' ? 'REPEAT' : 'MAIN';

  // 만석 검증
  const isBlocked =
    !group
      ? false
      : episodeKind === 'MAIN'
      ? !canAddMainEpisode(groupId!)
      : !canAddRepeatEpisode(groupId!);
  const mainCount = groupId ? getMainEpisodesByGroupId(groupId).length : 0;

  const [artistGroup, setArtistGroup] = useState<ArtistGroup | ''>(
    (group?.artistGroup ?? '') as ArtistGroup | '',
  );
  // REPEAT은 항상 displayOrder=6 고정, MAIN은 입력 가능 (다음 빈 슬롯 기본값)
  const [displayOrder, setDisplayOrder] = useState(
    episodeKind === 'REPEAT' ? REPEAT_EPISODE_DISPLAY_ORDER : Math.min(mainCount + 1, MAX_MAIN_EPISODES),
  );
  const [titleLang, setTitleLang] = useState<Lang>('KO');
  const [descLang, setDescLang] = useState<Lang>('KO');
  const [title, setTitle] = useState({ KO: '', EN: '', JA: '' });
  const [desc, setDesc] = useState({ KO: '', EN: '', JA: '' });
  const [imageUrl, setImageUrl] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const isValid =
    !isBlocked &&
    artistGroup !== '' &&
    isAllLangsFilled(title) &&
    isAllLangsFilled(desc) &&
    imageUrl.trim() !== '' &&
    displayOrder >= 1;

  const handleCancel = () => {
    if (window.confirm('작성 중인 내용이 사라집니다. 취소하시겠어요?')) {
      router.push('/sq/groups/list');
    }
  };

  const handleDraft = () => {
    if (!title.KO.trim()) {
      alert('한국어 타이틀은 임시저장에도 필수입니다.');
      return;
    }
    if (!imageUrl.trim()) {
      alert('메인 이미지는 임시저장에도 필수입니다.');
      return;
    }
    alert(`[Mock] 임시저장 (DRAFT) — '${title.KO}'`);
    router.push('/sq/groups/list');
  };

  const handlePublish = () => {
    if (!isValid) return;
    alert(`[Mock] 게시 (ACTIVE) — '${title.KO}' / 아티스트: ${artistGroup}`);
    router.push('/sq/groups/list');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다 (PNG/JPG/WebP).');
      return;
    }
    const url = `/uploads/${file.name}`;
    setImageFileName(file.name);
    setImageUrl(url);
    alert(`[Mock] 파일 드롭 — '${file.name}' (${(file.size / 1024).toFixed(1)} KB) → URL: ${url}`);
  };

  return (
    <div>
      <PageHeader
        title=""
        breadcrumbItems={[
          { label: '에피소드', href: '/sq/groups/list' },
          { label: '새 에피소드 생성' },
        ]}
      />

      <div className="flex items-start justify-between -mt-2 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={handleCancel} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[24px] font-bold text-gray-900">새 에피소드 생성</h1>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  episodeKind === 'REPEAT'
                    ? 'bg-violet-600 text-white'
                    : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                {episodeKind}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {group
                ? `${group.titleKO} 그룹에 추가 (메인 ${mainCount}/${MAX_MAIN_EPISODES})`
                : '그룹 컨텍스트 없음 — 그룹 상세에서 진입하세요'}
            </p>
          </div>
        </div>
      </div>

      {isBlocked && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 mb-6 flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <p className="text-sm text-rose-800 leading-relaxed">
            본 그룹은 이미 {episodeKind === 'MAIN' ? `메인 ${MAX_MAIN_EPISODES}개` : '반복 1개'} 최대치에 도달했습니다.
            추가 등록이 불가능합니다.
          </p>
        </div>
      )}

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 flex items-start gap-3">
        <InformationCircleIcon className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-indigo-900 mb-0.5">에피소드 생성 정책</p>
          <p className="text-xs text-indigo-800 leading-relaxed">
            본 화면에서는 마스터 메타데이터(아티스트·다국어 타이틀·다국어 설명·메인 이미지·표시 순서)만 입력합니다.
            <strong>기간은 상위 에피소드 그룹에서 관리</strong>하므로 본 화면에는 별도 기간 입력 필드가 없습니다.
            다국어 입력은 <strong>KO/EN/JA 3개 언어 모두 필수</strong>입니다 (Quest 화면과 동일 정책).
          </p>
        </div>
      </div>

      {/* 섹션 1 — 기본 정보 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <h4 className="text-base font-semibold text-gray-900 mb-4">기본 정보</h4>

        <div className="grid grid-cols-3 gap-5 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              아티스트 <span className="text-red-500">*</span>
              {group && (
                <span className="text-[11px] text-gray-400 font-normal ml-1">(그룹 아티스트 고정)</span>
              )}
            </label>
            {group ? (
              <div className="h-11 px-3 inline-flex items-center w-full bg-gray-50 border border-gray-200 rounded-lg text-sm">
                <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium bg-indigo-50 text-indigo-700 mr-2">
                  {group.artistGroup}
                </span>
                <span className="text-gray-500 text-xs">({group.titleKO})</span>
              </div>
            ) : (
              <select
                value={artistGroup}
                onChange={(e) => setArtistGroup(e.target.value as ArtistGroup | '')}
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="">아티스트 선택...</option>
                <option value="V01D">V01D</option>
                <option value="iKON">iKON</option>
                <option value="CELEBUS">CELEBUS</option>
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              표시 순서 <span className="text-red-500">*</span>
              {episodeKind === 'REPEAT' && (
                <span className="text-[11px] text-violet-600 font-normal ml-1">(REPEAT 고정: #{REPEAT_EPISODE_DISPLAY_ORDER})</span>
              )}
            </label>
            <input
              type="number"
              min={1}
              max={episodeKind === 'REPEAT' ? REPEAT_EPISODE_DISPLAY_ORDER : MAX_MAIN_EPISODES}
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Math.max(1, parseInt(e.target.value || '1', 10)))}
              readOnly={episodeKind === 'REPEAT'}
              className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 read-only:bg-gray-50 read-only:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">상태</label>
            <div className="h-11 px-3 inline-flex items-center bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
              DRAFT (자동)
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <LangField
            label="타이틀"
            required
            lang={titleLang}
            onLangChange={setTitleLang}
            value={title[titleLang]}
            onChange={(v) => setTitle({ ...title, [titleLang]: v })}
            placeholder="제목을 입력하세요"
            maxLength={100}
            values={title}
          />

          <LangTextarea
            label="에피소드 설명"
            required
            lang={descLang}
            onLangChange={setDescLang}
            value={desc[descLang]}
            onChange={(v) => setDesc({ ...desc, [descLang]: v })}
            placeholder="앱에 노출되는 설명을 입력하세요"
            maxLength={200}
            rows={4}
            values={desc}
          />
        </div>
      </div>

      {/* 섹션 2 — 메인 이미지 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <h4 className="text-base font-semibold text-gray-900 mb-1">
          메인 이미지 <span className="text-red-500">*</span>
        </h4>
        <p className="text-[11px] text-gray-500 mb-4">3:4 비율 권장 (예: 750×1000px), ≤5MB · PNG/JPG/WebP — 끌어다 놓거나 URL 직접 입력</p>

        <div className="grid grid-cols-[200px_1fr] gap-5 items-start">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`aspect-[3/4] rounded-lg flex items-center justify-center border-2 border-dashed transition-all ${
              dragOver
                ? 'border-indigo-500 bg-indigo-100 scale-[1.02]'
                : 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50'
            }`}
          >
            <div className="text-center px-3">
              <PhotoIcon className={`w-10 h-10 mx-auto mb-1 ${dragOver ? 'text-indigo-600' : 'text-indigo-300'}`} />
              <span className={`text-[11px] font-medium leading-tight ${dragOver ? 'text-indigo-700' : 'text-indigo-400'}`}>
                {imageFileName
                  ? `✓ ${imageFileName}`
                  : imageUrl
                  ? '이미지 URL 등록됨'
                  : dragOver
                  ? '여기에 놓아주세요'
                  : '이미지를 드래그&드롭'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                이미지 URL <span className="text-red-500">*</span>
                <span className="text-[11px] text-gray-400 ml-1">(CDN 업로드 후 URL 입력 또는 좌측에 드롭)</span>
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="/sq/story-main.jpg"
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => alert('[Mock] 파일 업로드 다이얼로그')}
              className="h-9 px-4 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100"
            >
              + 파일 업로드
            </button>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              에피소드 상위 메타 이미지로, 앱 홈/리스트 카드와 BO 상세 화면에 공통 노출됩니다. 퀘스트(하위)에는 별도 이미지가 없습니다.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>다음 단계</strong>: 에피소드 생성 후 상세 화면에서 <strong>퀘스트(1~10개)</strong>를 등록하세요.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-2">
        <button
          onClick={handleCancel}
          className="h-10 px-5 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100"
        >
          취소하기
        </button>
        <button
          onClick={handleDraft}
          className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          임시저장
        </button>
        <button
          onClick={handlePublish}
          disabled={!isValid}
          className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          생성하기
        </button>
      </div>
    </div>
  );
}
