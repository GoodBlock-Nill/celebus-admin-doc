'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, InformationCircleIcon, PhotoIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import { LangField, LangTextarea, isAllLangsFilled, type Lang } from '@/components/clone/LangField';
import { getStoryQuestById, getGroupById, MAX_EPISODES_PER_STORY } from '@/mock/sq';

type ArtistGroup = 'V01D' | 'iKON' | 'CELEBUS';

export default function SqEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const storyId = parseInt(id, 10);
  const story = getStoryQuestById(storyId);
  const group = story ? getGroupById(story.groupId) : undefined;
  const router = useRouter();

  // 아티스트는 그룹 아티스트로 고정 — 변경 불가
  const artistGroup: ArtistGroup = (story?.artistGroup ?? 'V01D') as ArtistGroup;
  const [titleLang, setTitleLang] = useState<Lang>('KO');
  const [descLang, setDescLang] = useState<Lang>('KO');
  const [title, setTitle] = useState({
    KO: story?.titleKO ?? '',
    EN: story?.titleEN ?? '',
    JA: story?.titleJA ?? '',
  });
  const [desc, setDesc] = useState({
    KO: story?.descKO ?? '',
    EN: story?.descEN ?? '',
    JA: story?.descJA ?? '',
  });
  const [imageUrl, setImageUrl] = useState(story?.imageUrl ?? '');
  const [imageFileName, setImageFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);

  if (!story) return <div className="p-8 text-sm text-gray-500">에피소드를 찾을 수 없습니다.</div>;

  const editableByStatus = story.status !== 'CLOSED';
  const isValid =
    isAllLangsFilled(title) &&
    isAllLangsFilled(desc) &&
    imageUrl.trim() !== '';

  const handleCancel = () => {
    if (window.confirm('수정 중인 내용이 사라집니다. 취소하시겠어요?')) {
      router.push(`/sq/${storyId}`);
    }
  };

  const handleSave = () => {
    if (!isValid || !editableByStatus) return;
    alert(`[Mock] 변경사항 저장 — '${title.KO}'`);
    router.push(`/sq/${storyId}`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!editableByStatus) return;
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!editableByStatus) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }
    const url = `/uploads/${file.name}`;
    setImageFileName(file.name);
    setImageUrl(url);
    alert(`[Mock] 파일 드롭 — '${file.name}' → ${url}`);
  };

  return (
    <div>
      <PageHeader
        title=""
        breadcrumbItems={[
          { label: '에피소드', href: '/sq/groups/list' },
          { label: story.titleKO, href: `/sq/${storyId}` },
          { label: '수정' },
        ]}
      />

      <div className="flex items-start justify-between -mt-2 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={handleCancel} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[24px] font-bold text-gray-900">에피소드 수정</h1>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  story.episodeKind === 'REPEAT'
                    ? 'bg-violet-600 text-white'
                    : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                {story.episodeKind}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium bg-indigo-50 text-indigo-700 mr-2">
                {story.artistGroup}
              </span>
              {story.titleKO}
            </p>
          </div>
        </div>
      </div>

      {!editableByStatus && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 mb-6 flex items-start gap-3">
          <InformationCircleIcon className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <p className="text-sm text-rose-800 leading-relaxed">
            <strong>CLOSED 상태</strong>의 에피소드는 수정할 수 없습니다. 본 페이지는 읽기 전용으로 진입했습니다.
          </p>
        </div>
      )}

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 flex items-start gap-3">
        <InformationCircleIcon className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-indigo-900 mb-0.5">에피소드 수정 정책</p>
          <p className="text-xs text-indigo-800 leading-relaxed">
            마스터 메타데이터만 수정 가능합니다. <strong>기간은 상위 그룹</strong>에서 관리하며 본 화면에서 변경할 수 없습니다.
            다국어는 <strong>KO/EN/JA 3개 언어 모두 필수</strong>입니다. 에피소드당 퀘스트는 최대 {MAX_EPISODES_PER_STORY}개입니다.
          </p>
        </div>
      </div>

      {/* 그룹 기간 (읽기 전용) */}
      {group && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-gray-500 mb-0.5">상위 그룹</div>
            <div className="text-sm font-medium text-gray-900">
              <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium bg-indigo-50 text-indigo-700 mr-2">
                {group.artistGroup}
              </span>
              {group.titleKO}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-gray-500 mb-0.5">그룹 기간 (읽기 전용)</div>
            <div className="text-sm text-gray-900 font-medium">{group.startDt} ~ {group.endDt}</div>
          </div>
        </div>
      )}

      {/* 섹션 1 — 기본 정보 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <h4 className="text-base font-semibold text-gray-900 mb-4">기본 정보</h4>

        <div className="grid grid-cols-2 gap-5 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              아티스트 <span className="text-red-500">*</span>
              <span className="text-[11px] text-gray-400 font-normal ml-1">(그룹 아티스트 고정 · 변경 불가)</span>
            </label>
            <div className="h-11 px-3 inline-flex items-center w-full bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium bg-indigo-50 text-indigo-700 mr-2">
                {artistGroup}
              </span>
              {group && <span className="text-gray-500 text-xs">({group.titleKO})</span>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              표시 순서
              <span className="text-[11px] text-gray-400 font-normal ml-1">(그룹 상세에서 ↑↓로 변경)</span>
            </label>
            <div className="h-11 px-3 inline-flex items-center w-full bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[11px] font-bold mr-2">
                #{story.displayOrder}
              </span>
              <span className="text-gray-500 text-xs">순서는 그룹 상세 화면의 ↑↓ 버튼으로 변경됩니다.</span>
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
            disabled={!editableByStatus}
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
            disabled={!editableByStatus}
          />
        </div>
      </div>

      {/* 섹션 2 — 메인 이미지 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <h4 className="text-base font-semibold text-gray-900 mb-1">
          메인 이미지 <span className="text-red-500">*</span>
        </h4>
        <p className="text-[11px] text-gray-500 mb-4">3:4 비율 권장, ≤5MB — 끌어다 놓거나 URL 직접 입력</p>

        <div className="grid grid-cols-[200px_1fr] gap-5 items-start">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`aspect-[3/4] rounded-lg flex items-center justify-center border-2 border-dashed transition-all ${
              !editableByStatus
                ? 'border-gray-200 bg-gray-50'
                : dragOver
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
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                disabled={!editableByStatus}
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
              />
            </div>
            <button
              onClick={() => alert('[Mock] 파일 업로드 다이얼로그')}
              disabled={!editableByStatus}
              className="h-9 px-4 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 disabled:bg-gray-100 disabled:text-gray-400"
            >
              + 파일 업로드
            </button>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              에피소드 상위 메타 이미지로, 앱 홈/리스트 카드와 BO 상세 화면에 공통 노출됩니다. ACTIVE 상태에서도 이미지 교체 가능합니다.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 grid grid-cols-4 gap-3 text-xs">
        <Info label="생성자" value={story.createdBy} />
        <Info label="생성 일시" value={story.createdAt} />
        <Info label="최근 수정자" value={story.updatedBy} />
        <Info label="최근 수정 일시" value={story.updatedAt} />
      </div>

      <div className="flex items-center justify-end gap-2 sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-2">
        <button
          onClick={handleCancel}
          className="h-10 px-5 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100"
        >
          취소하기
        </button>
        <button
          onClick={handleSave}
          disabled={!editableByStatus || !isValid}
          className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          변경사항 저장
        </button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-gray-500 mb-0.5">{label}</div>
      <div className="text-gray-900 font-medium">{value}</div>
    </div>
  );
}
