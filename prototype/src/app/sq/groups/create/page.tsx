'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import { hasActiveGroupForArtist, type ArtistGroup, type EpisodeGroupStatus } from '@/mock/sq';

interface FormState {
  artistGroup: ArtistGroup | '';
  titleKO: string;
  startDt: string;
  endDt: string;
  status: EpisodeGroupStatus;
}

const INITIAL_STATE: FormState = {
  artistGroup: '',
  titleKO: '',
  startDt: '',
  endDt: '',
  status: 'DRAFT',
};

export default function GroupCreatePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);

  const activeBlocked = form.artistGroup !== '' && form.status === 'ACTIVE' && hasActiveGroupForArtist(form.artistGroup as ArtistGroup);

  const isValid =
    form.artistGroup !== '' &&
    form.titleKO.trim() !== '' &&
    form.startDt !== '' &&
    form.endDt !== '' &&
    form.endDt > form.startDt &&
    !activeBlocked;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleCancel = () => {
    if (window.confirm('작성 중인 내용이 사라집니다. 취소하시겠어요?')) {
      router.push('/sq/groups/list');
    }
  };

  const handleSave = () => {
    if (!isValid) return;
    alert(`[Mock] 그룹 생성 (${form.status}) — '${form.titleKO}' / 아티스트: ${form.artistGroup} / ${form.startDt} ~ ${form.endDt}`);
    router.push('/sq/groups/list');
  };

  return (
    <div>
      <PageHeader
        title=""
        breadcrumbItems={[
          { label: '에피소드', href: '/sq/groups/list' },
          { label: '그룹 리스트', href: '/sq/groups/list' },
          { label: '새 그룹 생성' },
        ]}
      />

      <div className="flex items-start justify-between -mt-2 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={handleCancel} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-[24px] font-bold text-gray-900">새 에피소드 그룹 생성</h1>
            <p className="text-sm text-gray-500 mt-1">
              시즌·큐레이션 단위의 최상위 묶음. 생성 후 그룹 상세에서 에피소드를 추가하세요.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 flex items-start gap-3">
        <InformationCircleIcon className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-indigo-900 mb-0.5">에피소드 그룹 정책</p>
          <p className="text-xs text-indigo-800 leading-relaxed">
            아티스트별로 운영되며 <strong>ACTIVE 상태는 아티스트당 1개만 허용</strong>됩니다. ACTIVE 그룹이 이미 있다면 DRAFT로 우선 생성하고, 기존 그룹 CLOSED 후 ACTIVE 전환하세요.
            메인 이미지·다국어 타이틀은 그룹이 아닌 <strong>에피소드(하위)</strong>에서 설정합니다.
          </p>
        </div>
      </div>

      {activeBlocked && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <p className="text-sm text-rose-800 leading-relaxed">
            <strong>{form.artistGroup}</strong> 아티스트는 이미 ACTIVE 그룹이 존재합니다. DRAFT로 우선 생성하거나 기존 그룹을 CLOSED 후 ACTIVE 전환하세요.
          </p>
        </div>
      )}

      {/* 섹션 1 — 기본 정보 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">기본 정보</h4>
        <div className="grid grid-cols-2 gap-5 mb-5">
          <Field label="아티스트" required>
            <select
              value={form.artistGroup}
              onChange={(e) => update('artistGroup', e.target.value as ArtistGroup | '')}
              className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="">아티스트 선택...</option>
              <option value="V01D">V01D</option>
              <option value="iKON">iKON</option>
              <option value="CELEBUS">CELEBUS</option>
            </select>
          </Field>
          <Field label="상태" required hint="진행중은 아티스트당 1개 제한">
            <select
              value={form.status}
              onChange={(e) => update('status', e.target.value as EpisodeGroupStatus)}
              className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="DRAFT">임시저장</option>
              <option value="ACTIVE">진행중</option>
              <option value="CLOSED">종료</option>
            </select>
          </Field>
        </div>
        <Field label="타이틀" required hint="시즌·큐레이션을 식별할 짧은 이름">
          <input
            type="text"
            value={form.titleKO}
            onChange={(e) => update('titleKO', e.target.value)}
            maxLength={80}
            placeholder="예: V01D 2026 봄 시즌 (3-6월)"
            className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </Field>
      </div>

      {/* 섹션 2 — 기간 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">기간 설정</h4>
        <div className="grid grid-cols-2 gap-5">
          <Field label="시작일자" required>
            <input
              type="datetime-local"
              value={form.startDt}
              onChange={(e) => update('startDt', e.target.value)}
              className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </Field>
          <Field label="종료일자" required>
            <input
              type="datetime-local"
              value={form.endDt}
              onChange={(e) => update('endDt', e.target.value)}
              min={form.startDt || undefined}
              className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </Field>
        </div>
        {form.startDt && form.endDt && form.endDt <= form.startDt && (
          <p className="text-xs text-rose-600 mt-2">종료일자는 시작일자 이후로 설정해주세요.</p>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>다음 단계</strong>: 그룹 생성 후 상세 화면에서 <strong>에피소드</strong>를 추가하여 메인 이미지·다국어 타이틀·세부 기간을 설정하세요.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-2">
        <button
          onClick={handleCancel}
          className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={!isValid}
          className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {form.status === 'ACTIVE' ? 'ACTIVE로 생성' : 'DRAFT로 저장'}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  required = false,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 mb-1.5">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        {required && <span className="text-rose-500 text-xs">*</span>}
        {hint && <span className="text-[11px] text-gray-400 ml-1">({hint})</span>}
      </label>
      {children}
    </div>
  );
}
