'use client';

import { useState } from 'react';
import { ChevronUpDownIcon, PhotoIcon } from '@heroicons/react/24/outline';
import {
  type ArtistGroup,
  type BannerPeriod,
  type HomeBanner,
  type SlotKind,
  getArtistDisplay,
  getSlotKindBadge,
  getSlotKindLabel,
  SLOT_KIND_META,
} from '@/mock/home';
import DeeplinkPicker from '@/components/shared/DeeplinkPicker';
import { type Deeplink, type DeeplinkSourceType } from '@/types/deeplink';

interface Props {
  mode: 'create' | 'edit' | 'view';
  initial?: HomeBanner;
  // 슬롯 컨텍스트 — 신규 진입 시 슬롯 상세에서 prefill
  slotKind?: SlotKind;
  artistGroup?: ArtistGroup | null;
  onSubmit: (action: 'save_draft' | 'start_now' | 'save') => void;
  onCancel: () => void;
}

export default function BannerForm({
  mode,
  initial,
  slotKind,
  artistGroup,
  onSubmit,
  onCancel,
}: Props) {
  const readOnly = mode === 'view';

  // 슬롯 컨텍스트는 initial 우선 → props 다음
  const effectiveSlotKind = (initial?.slotKind ?? slotKind ?? 'MAIN') as SlotKind;
  const effectiveArtist = initial?.artistGroup ?? artistGroup ?? null;
  const slotMeta = SLOT_KIND_META[effectiveSlotKind];
  const slotLabel = getSlotKindLabel(effectiveSlotKind);
  const artistLabel = getArtistDisplay(effectiveArtist);
  const kindBadge = getSlotKindBadge(effectiveSlotKind);

  const [titleKO, setTitleKO] = useState(initial?.titleKO ?? '');
  const [titleEN, setTitleEN] = useState(initial?.titleEN ?? '');
  const [titleJP, setTitleJP] = useState(initial?.titleJP ?? '');
  const [subtitleKO, setSubtitleKO] = useState(initial?.subtitleKO ?? '');
  const [subtitleEN, setSubtitleEN] = useState(initial?.subtitleEN ?? '');
  const [subtitleJP, setSubtitleJP] = useState(initial?.subtitleJP ?? '');
  const [deeplink, setDeeplink] = useState<Deeplink>({
    source: (initial?.sourceType as DeeplinkSourceType | undefined) ?? 'NONE',
    value: initial?.linkUrl ?? '',
  });
  const initialPeriod: BannerPeriod = initial?.period ?? { type: 'CUSTOM', openDt: '', closeDt: '' };
  const [periodType, setPeriodType] = useState<'UNLIMITED' | 'CUSTOM'>(initialPeriod.type);
  const [openDt, setOpenDt] = useState(
    initialPeriod.type === 'CUSTOM' ? initialPeriod.openDt : ''
  );
  const [closeDt, setCloseDt] = useState(
    initialPeriod.type === 'CUSTOM' ? initialPeriod.closeDt : ''
  );

  const isCarousel = slotMeta.capacity === 'MULTI';

  return (
    <div className="space-y-6">
      {/* A. 슬롯 컨텍스트 — read-only */}
      <Section title="A. 슬롯 컨텍스트" description="이 배너가 등록될 슬롯입니다. 슬롯은 슬롯 상세 화면에서 선택합니다.">
        <div className="grid grid-cols-2 gap-3">
          <ReadOnlyBox label="배너 위치">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${kindBadge.bg} ${kindBadge.text}`}>
              {slotLabel}
            </span>
            <span className="ml-2 text-xs text-gray-500">
              {isCarousel ? `캐러셀 (최대 동시 ${slotMeta.capacityLimit}개)` : '단일'}
            </span>
          </ReadOnlyBox>
          <ReadOnlyBox label="아티스트">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                effectiveArtist === null ? 'bg-gray-100 text-gray-600' : 'bg-indigo-50 text-indigo-700'
              }`}
            >
              {artistLabel}
            </span>
          </ReadOnlyBox>
        </div>
      </Section>

      {/* B. 기본 정보 — 다국어 */}
      <Section title="B. 기본 정보 (다국어)" description="노출 시작 전에 KO/EN/JP 3언어 모두 입력해야 합니다.">
        <div className="space-y-4">
          <MultiLangRow
            label="메인 타이틀"
            max={30}
            ko={titleKO}
            en={titleEN}
            jp={titleJP}
            onKO={setTitleKO}
            onEN={setTitleEN}
            onJP={setTitleJP}
            disabled={readOnly}
          />
          <MultiLangRow
            label="서브 타이틀"
            max={60}
            ko={subtitleKO}
            en={subtitleEN}
            jp={subtitleJP}
            onKO={setSubtitleKO}
            onEN={setSubtitleEN}
            onJP={setSubtitleJP}
            disabled={readOnly}
          />
        </div>
      </Section>

      {/* C. 미디어 — 슬롯별 권장 비율 */}
      <Section
        title={`C. 미디어 — ${slotMeta.imageSpec.ratio} (권장 ${slotMeta.imageSpec.recommended})`}
        description="JPG/PNG/WEBP, 최대 50MB"
      >
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition">
          <PhotoIcon className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-600">이미지를 끌어다 놓거나 클릭해 업로드</p>
          <p className="text-xs text-gray-400 mt-1">
            권장 비율 {slotMeta.imageSpec.ratio} ({slotMeta.imageSpec.recommended})
          </p>
        </div>
      </Section>

      {/* D. 딥링크 */}
      <Section title="D. 딥링크 (선택)" description="배너 클릭 시 회원 앱 영역 이동. 소스 타입별 입력 가이드 노출. '이동 없음' 선택 시 표시 전용 배너">
        <DeeplinkPicker value={deeplink} onChange={setDeeplink} disabled={readOnly} />
      </Section>

      {/* E. 노출 기간 */}
      <Section
        title="E. 노출 기간"
        description="무기한은 운영자가 [즉시 노출 시작/종료]로 수동 제어. 사용자 지정은 일정 도래 시 자동 시작·종료."
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={readOnly}
              onClick={() => setPeriodType('UNLIMITED')}
              className={`text-left p-3 rounded-lg border-2 transition ${
                periodType === 'UNLIMITED'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } ${readOnly ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="font-medium text-sm text-gray-900">무기한</div>
              <div className="text-xs text-gray-500 mt-0.5">운영자가 직접 ON/OFF 제어</div>
            </button>
            <button
              type="button"
              disabled={readOnly}
              onClick={() => setPeriodType('CUSTOM')}
              className={`text-left p-3 rounded-lg border-2 transition ${
                periodType === 'CUSTOM'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } ${readOnly ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="font-medium text-sm text-gray-900">사용자 지정</div>
              <div className="text-xs text-gray-500 mt-0.5">시작·종료일 자동 처리 + 수동 오버라이드 가능</div>
            </button>
          </div>
          {periodType === 'CUSTOM' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">공개일시 (KST)</label>
                <input
                  value={openDt}
                  onChange={(e) => setOpenDt(e.target.value)}
                  disabled={readOnly}
                  placeholder="2026.05.20 00:00"
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">종료일시 (KST)</label>
                <input
                  value={closeDt}
                  onChange={(e) => setCloseDt(e.target.value)}
                  disabled={readOnly}
                  placeholder="2026.06.20 23:59"
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                />
              </div>
            </div>
          )}
          {isCarousel && (
            <p className="text-xs text-gray-500 pt-1">
              ※ 캐러셀 슬롯 슬라이드 순서는 {initial?.displayOrder
                ? `현재 ${initial.displayOrder}번. `
                : '저장 시 마지막 순서로 자동 배치되며, '}
              슬롯 상세 화면에서 드래그로 변경합니다.
            </p>
          )}
        </div>
      </Section>

      {/* 액션 */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          취소
        </button>
        {mode === 'create' && (
          <>
            <button
              type="button"
              onClick={() => onSubmit('save_draft')}
              className="h-10 px-4 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100"
            >
              임시저장
            </button>
            <button
              type="button"
              onClick={() => onSubmit('start_now')}
              className="h-10 px-4 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              저장 + 즉시 노출 시작
            </button>
          </>
        )}
        {mode === 'edit' && (
          <button
            type="button"
            onClick={() => onSubmit('save')}
            className="h-10 px-4 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            저장
          </button>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function ReadOnlyBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-600 mb-1">{label}</div>
      <div className="h-10 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-sm">
        {children}
      </div>
    </div>
  );
}

function SelectBox({
  value,
  onChange,
  options,
  disabled,
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
        className="w-full h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

function MultiLangRow({
  label,
  max,
  ko,
  en,
  jp,
  onKO,
  onEN,
  onJP,
  disabled,
}: {
  label: string;
  max: number;
  ko: string;
  en: string;
  jp: string;
  onKO: (v: string) => void;
  onEN: (v: string) => void;
  onJP: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-700 mb-2">
        {label} <span className="text-gray-400">(최대 {max}자)</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <LangInput lang="KO" value={ko} onChange={onKO} max={max} disabled={disabled} />
        <LangInput lang="EN" value={en} onChange={onEN} max={max} disabled={disabled} />
        <LangInput lang="JP" value={jp} onChange={onJP} max={max} disabled={disabled} />
      </div>
    </div>
  );
}

function LangInput({
  lang,
  value,
  onChange,
  max,
  disabled,
}: {
  lang: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
        {lang}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, max))}
        disabled={disabled}
        className="w-full h-10 pl-10 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
      />
    </div>
  );
}
