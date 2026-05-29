'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronUpDownIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { SUPPORT_GROUPS, type SupportEvent } from '@/mock/support';

// 수정 가능 범위 — [CEB-BO-SUP-201] §3.1
// all: 임시저장(전 항목) / limited: 모집중(이벤트명·설명·이미지만) / none: 그 외(읽기 전용)
export type EditableScope = 'all' | 'limited' | 'none';

interface FormState {
  titleKo: string; titleEn: string; titleJp: string;
  descKo: string; descEn: string; descJp: string;
  groupName: string;
  targetDuk: string;
  startAt: string; // datetime-local
  endAt: string;
  imageUrl: string;
}

interface Props {
  mode: 'create' | 'edit';
  initial?: SupportEvent;
  editableScope?: EditableScope; // edit 모드에서만 사용
  onSubmitCreate?: (action: 'save_draft' | 'create') => void;
  onCancelCreate?: () => void;
  onSaved?: () => void;
  onEditingChange?: (editing: boolean) => void;
}

function toInputDt(s?: string): string {
  if (!s) return '';
  const [d, t] = s.split(' ');
  return `${d.replace(/\./g, '-')}T${t ?? '00:00'}`;
}

export default function SupportForm({
  mode, initial, editableScope = 'all',
  onSubmitCreate, onCancelCreate, onSaved, onEditingChange,
}: Props) {
  // edit 모드는 조회(false)/수정(true) 토글. create 모드는 항상 편집.
  const [editing, setEditing] = useState(mode === 'create');

  const initialState: FormState = useMemo(() => ({
    titleKo: initial?.titleKo ?? '', titleEn: initial?.titleEn ?? '', titleJp: initial?.titleJp ?? '',
    descKo: initial?.descKo ?? '', descEn: initial?.descEn ?? '', descJp: initial?.descJp ?? '',
    groupName: initial?.groupName ?? '',
    targetDuk: initial?.targetDuk ? String(initial.targetDuk) : '',
    startAt: toInputDt(initial?.startAt), endAt: toInputDt(initial?.endAt),
    imageUrl: initial?.imageUrl ?? '',
  }), [initial]);

  const [form, setForm] = useState<FormState>(initialState);
  const set = (k: keyof FormState, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const readOnly = mode === 'edit' && !editing;
  // 잠금 분기: 목표·기간·그룹은 모집중(limited)에서 잠금
  const lockTargetPeriod = mode === 'edit' && editableScope === 'limited';
  const lockGroup = mode === 'edit'; // 그룹은 생성 후 변경 불가

  const dirty = mode === 'edit' && editing && JSON.stringify(form) !== JSON.stringify(initialState);
  useEffect(() => { onEditingChange?.(editing && dirty); }, [editing, dirty, onEditingChange]);

  // 검증 — [CEB-BO-SUP-101-CREATE] §4
  const requiredText =
    form.titleKo.trim() && form.titleEn.trim() && form.titleJp.trim() &&
    form.descKo.trim() && form.descEn.trim() && form.descJp.trim();
  const targetOk = /^\d+$/.test(form.targetDuk) && parseInt(form.targetDuk, 10) >= 1;
  const datesOk = !!form.startAt && !!form.endAt && form.endAt > form.startAt;
  const groupOk = !!form.groupName;

  const missing: string[] = [];
  if (!requiredText) missing.push('기본 정보(이벤트명·설명 한/영/일)');
  if (!groupOk) missing.push('그룹');
  if (!targetOk) missing.push('목표 응원량(1 이상)');
  if (!form.startAt || !form.endAt) missing.push('시작·마감일시');
  else if (form.endAt <= form.startAt) missing.push('마감일시(시작 이후)');
  const valid = missing.length === 0;

  const startEdit = () => { setEditing(true); };
  const cancelEdit = () => {
    if (dirty && !window.confirm('저장하지 않은 변경이 있습니다. 취소할까요?')) return;
    setForm(initialState); setEditing(false); onEditingChange?.(false);
  };
  const save = () => { setEditing(false); onEditingChange?.(false); onSaved?.(); };

  return (
    <div className="space-y-6">
      {/* 수정 액션 (상단 — 조회/수정 토글) — edit 모드 전용 */}
      {mode === 'edit' && (
        <div className="flex items-center justify-end gap-3">
          {editing && !valid && (
            <span className="text-xs text-rose-600">저장하려면 확인: {missing.join(', ')}</span>
          )}
          {editableScope !== 'none' && !editing && (
            <button onClick={startEdit} className={btnPrimary}>수정</button>
          )}
          {editing && (
            <>
              <button onClick={cancelEdit} className={btnGhost}>취소</button>
              <button onClick={save} disabled={!dirty || !valid} className={btnPrimary}>저장</button>
            </>
          )}
          {editableScope === 'none' && (
            <span className="text-xs text-gray-400">읽기 전용 — 현재 상태에서는 수정할 수 없습니다.</span>
          )}
        </div>
      )}

      {/* A. 기본 정보 (다국어) */}
      <Section title="A. 기본 정보 (다국어)" desc="이벤트명·설명은 한국어/영어/일본어 모두 필수 — 생성 시 검증.">
        <div className="space-y-4">
          <MultiLang label="이벤트명" required max={50}
            ko={form.titleKo} en={form.titleEn} jp={form.titleJp}
            onKo={(v) => set('titleKo', v)} onEn={(v) => set('titleEn', v)} onJp={(v) => set('titleJp', v)}
            disabled={readOnly} />
          <MultiLang label="설명" required max={500} textarea
            ko={form.descKo} en={form.descEn} jp={form.descJp}
            onKo={(v) => set('descKo', v)} onEn={(v) => set('descEn', v)} onJp={(v) => set('descJp', v)}
            disabled={readOnly} />
        </div>
      </Section>

      {/* B. 대상·목표 */}
      <Section title="B. 대상·목표" desc="응원은 보유 덕력 1:1 차감이므로 별도 단가 없이 목표 응원량(덕력)만 설정합니다.">
        <div className="grid grid-cols-2 gap-4">
          <Field label="그룹(아티스트)" required>
            <Select value={form.groupName} onChange={(v) => set('groupName', v)} disabled={readOnly || lockGroup}
              options={[{ value: '', label: '그룹 선택' }, ...SUPPORT_GROUPS.map((g) => ({ value: g, label: g }))]} />
            {lockGroup && !readOnly && <Hint>그룹은 생성 후 변경할 수 없습니다.</Hint>}
          </Field>
          <Field label="목표 응원량 (덕력)" required>
            <input type="number" min={1} value={form.targetDuk}
              onChange={(e) => set('targetDuk', e.target.value)} disabled={readOnly || lockTargetPeriod}
              className={inputCls} placeholder="예: 2000000" />
            {lockTargetPeriod && !readOnly && <Hint>모집 시작 후에는 목표 응원량을 변경할 수 없습니다.</Hint>}
          </Field>
        </div>
      </Section>

      {/* C. 일정 */}
      <Section title="C. 일정 (KST)" desc="게시 후 시작일시 도달 시 모집이 시작되고, 마감일시까지 미달성이면 자동 종료(전액 반환)됩니다.">
        <div className="grid grid-cols-2 gap-4">
          <Field label="시작일시" required>
            <input type="datetime-local" value={form.startAt} onChange={(e) => set('startAt', e.target.value)}
              disabled={readOnly || lockTargetPeriod} className={inputCls} />
          </Field>
          <Field label="마감일시" required>
            <input type="datetime-local" value={form.endAt} onChange={(e) => set('endAt', e.target.value)}
              disabled={readOnly || lockTargetPeriod} className={inputCls} />
            {lockTargetPeriod && !readOnly && <Hint>모집 시작 후에는 기간을 변경할 수 없습니다.</Hint>}
          </Field>
        </div>
      </Section>

      {/* D. 대표 이미지 */}
      <Section title="D. 대표 이미지" desc="권장 16:9 · JPG/PNG/WEBP (선택)">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <PhotoIcon className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-600">{form.imageUrl || '이미지를 끌어다 놓거나 클릭해 업로드'}</p>
          <p className="text-xs text-gray-400 mt-1">권장 비율 16:9 (1920×1080)</p>
        </div>
      </Section>

      {/* 생성 액션 (하단 CTA) — create 모드 전용 */}
      {mode === 'create' && (
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-200">
          <div className="text-xs text-rose-600 min-h-[1rem]">
            {!valid && <span>생성하려면 다음 항목을 입력해주세요: {missing.join(', ')}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onCancelCreate} className={btnGhost}>취소</button>
            <button onClick={() => onSubmitCreate?.('save_draft')} className={btnSoft}>임시저장</button>
            <button onClick={() => onSubmitCreate?.('create')} disabled={!valid} className={btnPrimary}>생성하기</button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = 'w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400';
const btnGhost = 'h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50';
const btnSoft = 'h-10 px-4 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100';
const btnPrimary = 'h-10 px-4 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300';

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {desc && <p className="text-xs text-gray-500 mt-1">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-600 mb-1">{label}{required && <span className="text-red-500"> *</span>}</div>
      {children}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-gray-400">{children}</p>;
}

function Select({ value, onChange, options, disabled }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        className="w-full h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

function MultiLang({ label, required, max, textarea, ko, en, jp, onKo, onEn, onJp, disabled }: {
  label: string; required?: boolean; max: number; textarea?: boolean;
  ko: string; en: string; jp: string;
  onKo: (v: string) => void; onEn: (v: string) => void; onJp: (v: string) => void; disabled?: boolean;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-700 mb-2">
        {label}{required && <span className="text-red-500"> *</span>} <span className="text-gray-400">(최대 {max}자)</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {([['KO', ko, onKo], ['EN', en, onEn], ['JP', jp, onJp]] as const).map(([lang, val, on]) => (
          <Lang key={lang} lang={lang} value={val} onChange={on} max={max} textarea={textarea} disabled={disabled} />
        ))}
      </div>
    </div>
  );
}

function Lang({ lang, value, onChange, max, textarea, disabled }: {
  lang: string; value: string; onChange: (v: string) => void; max: number; textarea?: boolean; disabled?: boolean;
}) {
  if (textarea) {
    return (
      <div className="relative">
        <span className="absolute left-2.5 top-2 text-xs font-semibold text-gray-400">{lang}</span>
        <textarea value={value} onChange={(e) => onChange(e.target.value.slice(0, max))} disabled={disabled} rows={3}
          className="w-full pt-7 px-2.5 pb-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400 resize-none" />
      </div>
    );
  }
  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">{lang}</span>
      <input value={value} onChange={(e) => onChange(e.target.value.slice(0, max))} disabled={disabled}
        className="w-full h-10 pl-10 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400" />
    </div>
  );
}
