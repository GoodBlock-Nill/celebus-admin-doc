'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import { getGroupById, hasActiveGroupForArtist, type ArtistGroup, type EpisodeGroupStatus } from '@/mock/sq';

interface FormState {
  artistGroup: ArtistGroup;
  titleKO: string;
  startDt: string;
  endDt: string;
  status: EpisodeGroupStatus;
}

function toDateTimeLocal(s: string): string {
  const m = s.match(/^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!m) return '';
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}`;
}

export default function GroupEditPage({ params }: { params: Promise<{ gid: string }> }) {
  const { gid } = use(params);
  const groupId = parseInt(gid, 10);
  const group = getGroupById(groupId);
  const router = useRouter();

  const [form, setForm] = useState<FormState>(() => ({
    artistGroup: (group?.artistGroup ?? 'V01D') as ArtistGroup,
    titleKO: group?.titleKO ?? '',
    startDt: toDateTimeLocal(group?.startDt ?? ''),
    endDt: toDateTimeLocal(group?.endDt ?? ''),
    status: (group?.status ?? 'DRAFT') as EpisodeGroupStatus,
  }));

  if (!group) return <div className="p-8 text-sm text-gray-500">에피소드 그룹을 찾을 수 없습니다.</div>;

  const editableByStatus = group.status !== 'CLOSED';
  const activeBlocked =
    form.status === 'ACTIVE' &&
    group.status !== 'ACTIVE' &&
    hasActiveGroupForArtist(form.artistGroup, group.id);

  const isValid =
    form.titleKO.trim() !== '' &&
    form.startDt !== '' &&
    form.endDt !== '' &&
    form.endDt > form.startDt &&
    !activeBlocked;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleCancel = () => {
    if (window.confirm('수정 중인 내용이 사라집니다. 취소하시겠어요?')) {
      router.push(`/sq/groups/${groupId}`);
    }
  };

  const handleSave = () => {
    if (!isValid || !editableByStatus) return;
    alert(`[Mock] 그룹 수정 — '${form.titleKO}' / ${form.status}`);
    router.push(`/sq/groups/${groupId}`);
  };

  return (
    <div>
      <PageHeader
        title=""
        breadcrumbItems={[
          { label: '에피소드', href: '/sq/groups/list' },
          { label: '그룹 리스트', href: '/sq/groups/list' },
          { label: group.titleKO, href: `/sq/groups/${groupId}` },
          { label: '수정' },
        ]}
      />

      <div className="flex items-start justify-between -mt-2 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={handleCancel} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-[24px] font-bold text-gray-900">에피소드 그룹 수정</h1>
            <p className="text-sm text-gray-500 mt-1">
              <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium bg-indigo-50 text-indigo-700 mr-2">
                {group.artistGroup}
              </span>
              {group.titleKO}
            </p>
          </div>
        </div>
      </div>

      {/* [CEB-BO-SQ-201-EDIT] §2-2 정합 — 상태별 알림 배너 (2026-05-21 sync 정정) */}
      {group.status === 'CLOSED' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <InformationCircleIcon className="w-5 h-5 text-gray-600 mt-0.5 shrink-0" />
          <p className="text-sm text-gray-700 leading-relaxed">
            <strong>종료된 그룹</strong>입니다. 수정 후 상태 전환은 불가합니다.
          </p>
        </div>
      )}
      {group.status === 'ACTIVE' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <InformationCircleIcon className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>진행중 그룹</strong>의 수정 사항은 즉시 회원 앱에 반영됩니다. 신중히 진행하세요.
          </p>
        </div>
      )}

      {activeBlocked && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <p className="text-sm text-rose-800 leading-relaxed">
            <strong>{form.artistGroup}</strong> 아티스트는 이미 다른 진행중 그룹이 존재합니다. 기존 그룹을 종료 후 본 그룹을 진행중으로 전환하세요.
          </p>
        </div>
      )}

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 flex items-start gap-3">
        <InformationCircleIcon className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-indigo-900 mb-0.5">그룹 수정 정책</p>
          <p className="text-xs text-indigo-800 leading-relaxed">
            한 아티스트당 <strong>진행중 그룹은 1개만 허용</strong>됩니다. 다른 그룹을 진행중 상태로 두려면 현재 그룹을 종료해주세요.
            메인 이미지·다국어는 그룹이 아닌 <strong>에피소드(하위)</strong>에서 설정합니다.
          </p>
        </div>
      </div>

      {/* 섹션 1 — 기본 정보 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">기본 정보</h4>
        <div className="grid grid-cols-2 gap-5 mb-5">
          <Field label="아티스트" required>
            <select
              value={form.artistGroup}
              onChange={(e) => update('artistGroup', e.target.value as ArtistGroup)}
              disabled={!editableByStatus}
              className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm bg-white disabled:bg-gray-50"
            >
              <option value="V01D">V01D</option>
              <option value="iKON">iKON</option>
              <option value="CELEBUS">CELEBUS</option>
            </select>
          </Field>
          {/* [CEB-BO-SQ-201-EDIT] §2-3 정합 — 상태는 본 화면에서 직접 수정 불가 (2026-05-21 sync 정정) */}
          <Field label="상태" hint="그룹 상세의 [진행중 전환] / [종료 전환] 액션으로만 변경 가능">
            <div className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 flex items-center text-gray-600">
              {group.status === 'DRAFT' ? '임시저장' : group.status === 'ACTIVE' ? '진행중' : '종료'}
            </div>
          </Field>
        </div>
        <Field label="타이틀" required>
          <input
            type="text"
            value={form.titleKO}
            onChange={(e) => update('titleKO', e.target.value)}
            maxLength={80}
            disabled={!editableByStatus}
            className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
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
              disabled={!editableByStatus || group.status === 'ACTIVE'}
              className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
            />
            {group.status === 'ACTIVE' && (
              <p className="text-[11px] text-amber-600 mt-1">ACTIVE 상태에서는 시작일자 수정 불가</p>
            )}
          </Field>
          <Field label="종료일자" required>
            <input
              type="datetime-local"
              value={form.endDt}
              onChange={(e) => update('endDt', e.target.value)}
              min={form.startDt || undefined}
              disabled={!editableByStatus}
              className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
            />
          </Field>
        </div>
        {form.startDt && form.endDt && form.endDt <= form.startDt && (
          <p className="text-xs text-rose-600 mt-2">종료일자는 시작일자 이후로 설정해주세요.</p>
        )}
      </div>

      {/* 관리 정보 */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 grid grid-cols-4 gap-3 text-xs">
        <Info label="생성자" value={group.createdBy} />
        <Info label="생성 일시" value={group.createdAt} />
        <Info label="최근 수정자" value={group.updatedBy} />
        <Info label="최근 수정 일시" value={group.updatedAt} />
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
          disabled={!editableByStatus || !isValid}
          className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          변경사항 저장
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-gray-500 mb-0.5">{label}</div>
      <div className="text-gray-900 font-medium">{value}</div>
    </div>
  );
}
