'use client';

import { useState } from 'react';
import { ArrowUpTrayIcon, PlusIcon, CalendarIcon, ClockIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import {
  EMPTY_REWARD,
  REPEAT_CYCLE_LABEL,
  hasAnyReward,
  type QuestStatus,
  type QuestKind,
  type RepeatCycle,
  type RewardConfig,
  type RelatedLink,
} from '@/mock/fanquest';

// ─────────────────────────────────────────────
// 옵션 & 타입
// ─────────────────────────────────────────────

export const ARTIST_OPTIONS = ['V01D', 'iKON', 'CELEBUS'] as const;
export const QUEST_TYPE_OPTIONS = ['이미지 촬영 및 업로드'] as const;
export const REPEAT_CYCLE_OPTIONS: RepeatCycle[] = ['DAILY', 'WEEKLY', 'MONTHLY'];

const LANGS = ['KO', 'EN', 'JA'] as const;
type Lang = typeof LANGS[number];

export interface QuestFormValues {
  titleKO: string;
  titleEN: string;
  titleJA: string;
  descKO: string;
  descEN: string;
  descJA: string;
  guideKO: string;
  guideEN: string;
  guideJA: string;
  imageSrc: string;
  artist: string;
  questType: string;
  endDate: string; // 'YYYY-MM-DD'
  endTime: string; // 'HH:mm'
  relatedLinks: RelatedLink[];
  kind: QuestKind;
  repeatCycle?: RepeatCycle;
  reward: RewardConfig;
}

export const EMPTY_FORM_VALUES: QuestFormValues = {
  titleKO: '',
  titleEN: '',
  titleJA: '',
  descKO: '',
  descEN: '',
  descJA: '',
  guideKO: '',
  guideEN: '',
  guideJA: '',
  imageSrc: '',
  artist: '',
  questType: '이미지 촬영 및 업로드',
  endDate: '',
  endTime: '23:59',
  relatedLinks: [],
  kind: '일반',
  reward: EMPTY_REWARD,
};

// ─────────────────────────────────────────────
// QuestForm — 생성/수정 공용
// ─────────────────────────────────────────────

interface QuestFormProps {
  mode: 'create' | 'edit';
  /** 수정 모드일 때 현재 quest 상태. 진행중일 때 보상·일정 등 일부 필드 비활성 */
  questStatus?: QuestStatus;
  initialValues: QuestFormValues;
  onChange: (values: QuestFormValues) => void;
  values: QuestFormValues;
}

export function QuestForm({ mode, questStatus, values, onChange }: QuestFormProps) {
  const editingActive = mode === 'edit' && questStatus === '진행중';
  const lockedFields = editingActive;

  const update = <K extends keyof QuestFormValues>(key: K, v: QuestFormValues[K]) => {
    onChange({ ...values, [key]: v });
  };

  return (
    <div className="space-y-5">
      {editingActive && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          진행중 상태에서는 기본 정보(타이틀, 설명, 가이드, 연관 링크)만 수정 가능합니다.
        </div>
      )}

      {/* 기본 정보 */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">기본 정보</h2>

        <LangField
          label="타이틀"
          required
          values={{ KO: values.titleKO, EN: values.titleEN, JA: values.titleJA }}
          onChange={(lang, v) => update(`title${lang}` as keyof QuestFormValues, v as never)}
          placeholder="제목을 입력하세요"
          maxLength={100}
        />

        <LangTextarea
          label="설명"
          required
          values={{ KO: values.descKO, EN: values.descEN, JA: values.descJA }}
          onChange={(lang, v) => update(`desc${lang}` as keyof QuestFormValues, v as never)}
          placeholder="설명을 입력하세요"
          maxLength={200}
          rows={4}
        />

        <LangTextarea
          label="유저 가이드"
          required
          values={{ KO: values.guideKO, EN: values.guideEN, JA: values.guideJA }}
          onChange={(lang, v) => update(`guide${lang}` as keyof QuestFormValues, v as never)}
          placeholder="유저 가이드를 입력하세요"
          maxLength={500}
          rows={6}
        />

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            대표 이미지 <span className="text-red-500">*</span>
          </label>
          {values.imageSrc ? (
            <div className="flex items-center gap-3">
              <div className="w-32 h-32 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                <span className="text-xs text-gray-500">이미지</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => alert('[Mock] 파일 변경 다이얼로그')}
                  className="h-9 px-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  변경
                </button>
                <button
                  type="button"
                  onClick={() => update('imageSrc', '')}
                  className="h-9 px-3 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100"
                >
                  제거
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                update('imageSrc', '/sq/placeholder.jpg');
              }}
              className="w-full px-4 py-5 border-2 border-dashed border-gray-300 rounded-lg flex items-center gap-3 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <ArrowUpTrayIcon className="w-5 h-5 text-gray-500" />
              </div>
              <div className="text-xs text-gray-500 flex-1 min-w-0">
                <div className="font-medium text-gray-700">클릭하거나 파일을 드래그하세요</div>
                <div className="mt-0.5 truncate">권장: 1:1 비율 · jpeg, png, jpg, webp, gif, svg (최대 5MB)</div>
              </div>
            </button>
          )}
        </div>
      </section>

      {/* 퀘스트 설정 */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">퀘스트 설정</h2>

        <FieldRow label="아티스트" required>
          <SelectInput
            value={values.artist}
            onChange={(v) => update('artist', v)}
            disabled={lockedFields}
            options={[{ value: '', label: '아티스트 선택' }, ...ARTIST_OPTIONS.map((a) => ({ value: a, label: a }))]}
          />
        </FieldRow>

        <FieldRow label="퀘스트 타입" required>
          <SelectInput
            value={values.questType}
            onChange={(v) => update('questType', v)}
            disabled={lockedFields}
            options={QUEST_TYPE_OPTIONS.map((t) => ({ value: t, label: t }))}
          />
        </FieldRow>

        <div className="border-t border-gray-100" />

        <FieldRow label="참여 방식" required>
          <div className="flex items-center gap-3">
            {(['일반', '반복'] as QuestKind[]).map((k) => (
              <label
                key={k}
                className={`flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-lg border text-sm cursor-pointer ${
                  values.kind === k ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium' : 'border-gray-200 text-gray-700'
                } ${lockedFields ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="questKind"
                  className="w-4 h-4 accent-indigo-600"
                  checked={values.kind === k}
                  onChange={() => {
                    if (lockedFields) return;
                    onChange({
                      ...values,
                      kind: k,
                      repeatCycle: k === '반복' ? (values.repeatCycle ?? 'WEEKLY') : undefined,
                    });
                  }}
                  disabled={lockedFields}
                />
                {k}
                <span className="text-[11px] text-gray-400 font-normal">
                  {k === '일반' ? '1회 참여' : '주기 반복'}
                </span>
              </label>
            ))}
          </div>
        </FieldRow>

        {values.kind === '반복' && (
          <FieldRow label="반복 주기" required>
            <CycleButtonGroup
              value={values.repeatCycle ?? 'WEEKLY'}
              onChange={(v) => update('repeatCycle', v)}
              disabled={lockedFields}
            />
            <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
              유저는 매 {REPEAT_CYCLE_LABEL[values.repeatCycle ?? 'WEEKLY']} 1회 제출 가능. 운영 종료일까지 반복 후 자동 종료됩니다.
            </p>
          </FieldRow>
        )}

        <FieldRow label={values.kind === '반복' ? '운영 종료일' : '마감 일시'} required>
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <div className="relative">
              <input
                type="date"
                value={values.endDate}
                min={minEndDate()}
                onChange={(e) => update('endDate', e.target.value)}
                disabled={lockedFields}
                placeholder={values.kind === '반복' ? '운영 종료일 선택' : '마감일 선택'}
                className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-400"
              />
              <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="time"
                value={values.endTime}
                onChange={(e) => update('endTime', e.target.value)}
                disabled={lockedFields}
                className="w-full h-11 pl-9 pr-3 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
            {values.kind === '반복'
              ? '* 시작 일시는 게시 시점에 자동으로 설정됩니다. 이 날짜까지 반복 진행 후 자동 종료됩니다.'
              : `* 시작 일시는 게시 시점에 자동으로 설정됩니다.${mode === 'create' ? ' 마감일은 오늘 기준 최소 1일 이후부터 선택 가능합니다.' : ''}`}
          </p>
        </FieldRow>

        <div className="border-t border-gray-100" />

        <FieldRow label="연관 링크">
          <RelatedLinksEditor
            links={values.relatedLinks}
            onChange={(next) => update('relatedLinks', next)}
            disabled={false /* 진행중에도 연관 링크는 수정 가능 */}
          />
        </FieldRow>
      </section>

      {/* 보상 설정 */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">보상 설정</h2>
          <p className="text-[11px] text-gray-500 mt-1">
            지급할 보상을 1개 이상 선택해주세요. 선택한 항목만 유저에게 지급됩니다.
          </p>
        </div>

        <RewardRow
          label="응모권"
          unit="장"
          enabled={values.reward.ticket.enabled}
          value={values.reward.ticket.count}
          locked={lockedFields}
          onToggle={(en) => update('reward', { ...values.reward, ticket: { enabled: en, count: en ? Math.max(1, values.reward.ticket.count) : values.reward.ticket.count } })}
          onChange={(n) => update('reward', { ...values.reward, ticket: { ...values.reward.ticket, count: n } })}
        />

        <RewardRow
          label="덕력"
          unit="DUK"
          enabled={values.reward.duk.enabled}
          value={values.reward.duk.amount}
          locked={lockedFields}
          onToggle={(en) => update('reward', { ...values.reward, duk: { enabled: en, amount: en ? Math.max(1, values.reward.duk.amount) : values.reward.duk.amount } })}
          onChange={(n) => update('reward', { ...values.reward, duk: { ...values.reward.duk, amount: n } })}
        />

        <div>
          <label className={`flex items-center gap-2 cursor-pointer ${lockedFields ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input
              type="checkbox"
              className="w-4 h-4 accent-indigo-600"
              checked={values.reward.nft.enabled}
              onChange={(e) => update('reward', { ...values.reward, nft: { ...values.reward.nft, enabled: e.target.checked } })}
              disabled={lockedFields}
            />
            <span className="text-sm font-medium text-gray-900">NFT</span>
          </label>
          {values.reward.nft.enabled && (
            <div className="mt-2 ml-6 space-y-1.5">
              <SelectInput
                value=""
                onChange={() => {}}
                disabled
                options={[{ value: '', label: '선택 가능한 NFT 이벤트가 없습니다.' }]}
              />
              <p className="text-[11px] text-gray-500 leading-relaxed">
                선택 가능한 NFT 이벤트가 없습니다. BIVE 메뉴에서 이벤트를 먼저 생성해주세요.
              </p>
            </div>
          )}
        </div>

        {!hasAnyReward(values.reward) && (
          <p className="text-xs text-red-600">보상 항목을 1개 이상 선택해주세요.</p>
        )}
      </section>
    </div>
  );
}

function RewardRow({
  label, unit, enabled, value, locked, onToggle, onChange,
}: {
  label: string;
  unit: string;
  enabled: boolean;
  value: number;
  locked: boolean;
  onToggle: (en: boolean) => void;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <label className={`flex items-center gap-2 cursor-pointer ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <input
          type="checkbox"
          className="w-4 h-4 accent-indigo-600"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          disabled={locked}
        />
        <span className="text-sm font-medium text-gray-900">{label}</span>
      </label>
      {enabled && (
        <div className="mt-2 ml-6 flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={value || ''}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              onChange(Number.isFinite(n) && n > 0 ? n : 0);
            }}
            disabled={locked}
            placeholder="수량 입력"
            className="w-32 h-10 px-3 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-500">{unit}</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 검증
// ─────────────────────────────────────────────

export function canSubmitQuest(values: QuestFormValues, mode: 'create' | 'edit', questStatus?: QuestStatus): boolean {
  const triCheck = (a: string, b: string, c: string) => !!(a.trim() && b.trim() && c.trim());
  const basicOk = triCheck(values.titleKO, values.titleEN, values.titleJA) &&
                  triCheck(values.descKO, values.descEN, values.descJA) &&
                  triCheck(values.guideKO, values.guideEN, values.guideJA) &&
                  !!values.imageSrc;

  if (mode === 'edit' && questStatus === '진행중') {
    return basicOk;
  }

  // 보상 1개 이상 활성 + 활성 시 수량 > 0
  const rewardOk = hasAnyReward(values.reward) &&
    (!values.reward.ticket.enabled || values.reward.ticket.count > 0) &&
    (!values.reward.duk.enabled || values.reward.duk.amount > 0);

  // 반복형은 주기 필수
  const repeatOk = values.kind === '일반' || !!values.repeatCycle;

  return basicOk && !!values.artist && !!values.endDate && rewardOk && repeatOk;
}

function minEndDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────
// 반복 주기 버튼 그룹
// ─────────────────────────────────────────────

function CycleButtonGroup({
  value, onChange, disabled,
}: {
  value: RepeatCycle;
  onChange: (v: RepeatCycle) => void;
  disabled?: boolean;
}) {
  const items: { v: RepeatCycle; label: string; icon: string; sub: string }[] = [
    { v: 'DAILY', label: '일간', icon: '☀️', sub: '하루 1회' },
    { v: 'WEEKLY', label: '주간', icon: '🗓️', sub: '주 1회' },
    { v: 'MONTHLY', label: '월간', icon: '📅', sub: '월 1회' },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((i) => (
        <button
          type="button"
          key={i.v}
          onClick={() => { if (!disabled) onChange(i.v); }}
          disabled={disabled}
          className={`flex flex-col items-center gap-1 py-3 rounded-lg border text-sm transition-colors ${
            value === i.v
              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
              : 'border-gray-200 text-gray-700 hover:border-gray-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed hover:border-gray-200' : 'cursor-pointer'}`}
        >
          <span className="text-xl">{i.icon}</span>
          <span className="font-medium">{i.label}</span>
          <span className="text-[11px] text-gray-500">{i.sub}</span>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 다국어 입력 컴포넌트
// ─────────────────────────────────────────────

function LangField({
  label, required, values, onChange, placeholder, maxLength,
}: {
  label: string;
  required?: boolean;
  values: Record<Lang, string>;
  onChange: (lang: Lang, v: string) => void;
  placeholder?: string;
  maxLength: number;
}) {
  const [lang, setLang] = useState<Lang>('KO');
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-900">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <LangTabs active={lang} onChange={setLang} values={values} />
      </div>
      <input
        value={values[lang]}
        onChange={(e) => onChange(lang, e.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <div className="text-right text-xs text-gray-400 mt-1">{values[lang].length} / {maxLength}</div>
    </div>
  );
}

function LangTextarea({
  label, required, values, onChange, placeholder, maxLength, rows,
}: {
  label: string;
  required?: boolean;
  values: Record<Lang, string>;
  onChange: (lang: Lang, v: string) => void;
  placeholder?: string;
  maxLength: number;
  rows: number;
}) {
  const [lang, setLang] = useState<Lang>('KO');
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-900">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <LangTabs active={lang} onChange={setLang} values={values} />
      </div>
      <textarea
        value={values[lang]}
        onChange={(e) => onChange(lang, e.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        rows={rows}
        className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <div className="text-right text-xs text-gray-400 mt-1">{values[lang].length} / {maxLength}</div>
    </div>
  );
}

function LangTabs({ active, onChange, values }: { active: Lang; onChange: (l: Lang) => void; values: Record<Lang, string> }) {
  return (
    <div className="inline-flex bg-gray-50 rounded-lg p-0.5">
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={`relative px-3 py-1 text-xs font-semibold rounded-md ${active === l ? 'bg-gray-900 text-white' : 'text-gray-600'}`}
        >
          {l}
          {!values[l].trim() && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 연관 링크 에디터 (다국어 라벨 + URL)
// ─────────────────────────────────────────────

function RelatedLinksEditor({
  links, onChange, disabled,
}: {
  links: RelatedLink[];
  onChange: (next: RelatedLink[]) => void;
  disabled?: boolean;
}) {
  const addRow = () => {
    onChange([...links, { labelKO: '', labelEN: '', labelJA: '', href: '' }]);
  };
  const removeRow = (idx: number) => onChange(links.filter((_, i) => i !== idx));
  const update = (idx: number, patch: Partial<RelatedLink>) => {
    onChange(links.map((l, i) => i === idx ? { ...l, ...patch } : l));
  };

  return (
    <div className="space-y-3">
      {links.map((link, idx) => (
        <RelatedLinkRow
          key={idx}
          link={link}
          disabled={disabled}
          onChange={(patch) => update(idx, patch)}
          onRemove={() => removeRow(idx)}
        />
      ))}
      <button
        type="button"
        onClick={addRow}
        disabled={disabled}
        className="inline-flex items-center gap-1 text-indigo-600 text-sm font-medium hover:underline disabled:opacity-50"
      >
        <PlusIcon className="w-4 h-4" />링크 추가
      </button>
    </div>
  );
}

function RelatedLinkRow({
  link, disabled, onChange, onRemove,
}: {
  link: RelatedLink;
  disabled?: boolean;
  onChange: (patch: Partial<RelatedLink>) => void;
  onRemove: () => void;
}) {
  const [lang, setLang] = useState<Lang>('KO');
  const labelValues: Record<Lang, string> = { KO: link.labelKO, EN: link.labelEN, JA: link.labelJA };

  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">라벨</span>
        <div className="flex items-center gap-2">
          <LangTabs active={lang} onChange={setLang} values={labelValues} />
          <button
            type="button"
            onClick={onRemove}
            className="w-7 h-7 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      <input
        value={labelValues[lang]}
        onChange={(e) => onChange({ [`label${lang}`]: e.target.value.slice(0, 20) } as Partial<RelatedLink>)}
        disabled={disabled}
        placeholder="링크 라벨을 입력하세요"
        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50"
      />
      <div className="text-right text-xs text-gray-400">{labelValues[lang].length} / 20</div>
      <div>
        <span className="text-xs font-medium text-gray-500 mb-1 block">URL</span>
        <input
          value={link.href}
          onChange={(e) => onChange({ href: e.target.value })}
          disabled={disabled}
          placeholder="https://"
          className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 공용 폼 위젯
// ─────────────────────────────────────────────

function FieldRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function SelectInput({
  value, onChange, options, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}
