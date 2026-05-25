'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronUpDownIcon, PhotoIcon } from '@heroicons/react/24/outline';
import {
  type ArtistGroup,
  type BannerPeriod,
  type HomeBanner,
  type SlotKind,
  ACTIVE_ARTISTS,
  getArtistDisplay,
  getSlotKindBadge,
  getSlotKindLabel,
  SLOT_KIND_META,
} from '@/mock/home';
// 변경 추적용 snapshot은 핵심 필드만 평탄화해 비교한다. 신규 입력 필드를 추가할 때는
// 반드시 initialSnapshot/currentSnapshot 양쪽에 해당 필드를 함께 추가해야 false negative가
// 발생하지 않는다. (v6.9 정합 노트 — B4 모니터링 항목)
import DeeplinkPicker from '@/components/shared/DeeplinkPicker';
import { type Deeplink } from '@/types/deeplink';

interface Props {
  mode: 'create' | 'edit' | 'view';
  initial?: HomeBanner;
  // 슬롯 컨텍스트 — 신규 진입 시 슬롯 상세에서 prefill
  slotKind?: SlotKind;
  artistGroup?: ArtistGroup | null;
  // v6.8: 복제 모드 시 슬롯 컨텍스트 편집 가능
  slotEditable?: boolean;
  // v6.8: 변경 추적 통지 (수정 모드 [취소] 시 EditCancel 모달 트리거에 사용)
  onHasChangedChange?: (hasChanged: boolean) => void;
  onSubmit: (action: 'save_draft' | 'create' | 'save') => void;
  onCancel: () => void;
}

const ALL_SLOT_KINDS: SlotKind[] = ['MAIN', 'TODAY_TODO', 'TOGETHER', 'MISSION'];

export default function BannerForm({
  mode,
  initial,
  slotKind,
  artistGroup,
  slotEditable = false,
  onHasChangedChange,
  onSubmit,
  onCancel,
}: Props) {
  const readOnly = mode === 'view';

  // 슬롯 컨텍스트는 initial 우선 → props 다음
  const initialSlotKind = (initial?.slotKind ?? slotKind ?? 'MAIN') as SlotKind;
  const initialArtist = initial?.artistGroup ?? artistGroup ?? null;

  // v6.8: 복제 모드 시 슬롯 컨텍스트도 state로 관리
  const [editSlotKind, setEditSlotKind] = useState<SlotKind>(initialSlotKind);
  const [editArtist, setEditArtist] = useState<ArtistGroup | null>(initialArtist);

  const effectiveSlotKind = slotEditable ? editSlotKind : initialSlotKind;
  const effectiveArtist = slotEditable ? editArtist : initialArtist;
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
  const [altTextKO, setAltTextKO] = useState(initial?.altTextKO ?? '');
  const [altTextEN, setAltTextEN] = useState(initial?.altTextEN ?? '');
  const [altTextJP, setAltTextJP] = useState(initial?.altTextJP ?? '');
  const [deeplink, setDeeplink] = useState<Deeplink>({
    sourceType: initial?.sourceType ?? '',
    url: initial?.linkUrl ?? '',
  });
  // v6.7/v6.8 정합: 공개일 항상 필수 + 종료일만 무기한 옵션
  const initialPeriod: BannerPeriod = initial?.period ?? { type: 'CUSTOM', openDt: '', closeDt: '' };
  const [openDt, setOpenDt] = useState(
    initialPeriod.type === 'CUSTOM' ? initialPeriod.openDt : ''
  );
  const [closeDt, setCloseDt] = useState(
    initialPeriod.type === 'CUSTOM' ? initialPeriod.closeDt : ''
  );
  const [closeUnlimited, setCloseUnlimited] = useState(
    initialPeriod.type === 'UNLIMITED' || (initialPeriod.type === 'CUSTOM' && !initialPeriod.closeDt)
  );

  const isCarousel = slotMeta.capacity === 'MULTI';

  // v6.8: 변경 추적 — initialSnapshot vs currentSnapshot 핵심 필드 비교
  const initialSnapshot = useMemo(() => JSON.stringify({
    slotKind: initialSlotKind, artist: initialArtist,
    titleKO: initial?.titleKO ?? '', titleEN: initial?.titleEN ?? '', titleJP: initial?.titleJP ?? '',
    subtitleKO: initial?.subtitleKO ?? '', subtitleEN: initial?.subtitleEN ?? '', subtitleJP: initial?.subtitleJP ?? '',
    altTextKO: initial?.altTextKO ?? '', altTextEN: initial?.altTextEN ?? '', altTextJP: initial?.altTextJP ?? '',
    sourceType: initial?.sourceType ?? '', linkUrl: initial?.linkUrl ?? '',
    openDt: initialPeriod.type === 'CUSTOM' ? initialPeriod.openDt : '',
    closeDt: initialPeriod.type === 'CUSTOM' ? initialPeriod.closeDt : '',
    closeUnlimited: initialPeriod.type === 'UNLIMITED' || (initialPeriod.type === 'CUSTOM' && !initialPeriod.closeDt),
  }), [initial, initialSlotKind, initialArtist, initialPeriod]);

  const currentSnapshot = JSON.stringify({
    slotKind: effectiveSlotKind, artist: effectiveArtist,
    titleKO, titleEN, titleJP, subtitleKO, subtitleEN, subtitleJP,
    altTextKO, altTextEN, altTextJP,
    sourceType: deeplink.sourceType, linkUrl: deeplink.url,
    openDt, closeDt, closeUnlimited,
  });

  const hasChanged = currentSnapshot !== initialSnapshot;

  useEffect(() => {
    onHasChangedChange?.(hasChanged);
  }, [hasChanged, onHasChangedChange]);

  // v6.8: 슬롯 변경 시 권장 비율 안내 — 비율 변경된 경우만 표시
  const initialRatio = SLOT_KIND_META[initialSlotKind].imageSpec.ratio;
  const currentRatio = slotMeta.imageSpec.ratio;
  const ratioChanged = slotEditable && initialRatio !== currentRatio;

  // v6.9 (A1): 슬롯 변경 시 자동 강제 useEffect 제거.
  // 운영자가 명시적으로 아티스트를 선택하도록 강제 (잘못된 아티스트 자동 채움 방지).
  // GLOBAL_ONLY 슬롯에서는 아티스트가 '전역'으로 고정되도록 옵션 1개만 노출하고 disabled.
  // ARTIST_ONLY 슬롯에서 운영자가 아직 아티스트를 선택하지 않은 경우 [생성하기]/[저장] disabled로 차단.

  // v6.9 (A1): ARTIST_ONLY 슬롯인데 아티스트가 null이면 미선택 상태 — 저장 차단
  const artistMissing =
    slotEditable && slotMeta.targetMode === 'ARTIST_ONLY' && editArtist === null;
  const canSubmit = !artistMissing;

  return (
    <div className="space-y-6">
      {/* A. 슬롯 컨텍스트 — slotEditable 분기 (v6.8) */}
      <Section
        title="A. 슬롯 컨텍스트"
        description={
          slotEditable
            ? '복제 모드 — 다른 슬롯·아티스트에도 등록 가능합니다. 슬롯 변경 시 미디어 권장 비율이 변경될 수 있습니다.'
            : '이 배너가 등록될 슬롯입니다. 슬롯은 슬롯 상세 화면에서 선택합니다.'
        }
      >
        <div className="grid grid-cols-2 gap-3">
          {slotEditable ? (
            <>
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1">배너 위치</div>
                <SelectBox
                  value={editSlotKind}
                  onChange={(v) => setEditSlotKind(v as SlotKind)}
                  options={ALL_SLOT_KINDS.map((k) => ({ value: k, label: `${SLOT_KIND_META[k].label} (${SLOT_KIND_META[k].capacity === 'MULTI' ? `캐러셀 · 최대 ${SLOT_KIND_META[k].capacityLimit}개` : '단일'})` }))}
                />
              </div>
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1">아티스트 {artistMissing && <span className="text-rose-500">*</span>}</div>
                {slotMeta.targetMode === 'GLOBAL_ONLY' ? (
                  /* GLOBAL_ONLY 슬롯은 옵션 자체가 '전역' 하나뿐 — 자동 고정 표시 */
                  <SelectBox
                    value="GLOBAL"
                    onChange={() => setEditArtist(null)}
                    disabled
                    options={[{ value: 'GLOBAL', label: '전역 (해당 슬롯은 전역만 지원)' }]}
                  />
                ) : (
                  <SelectBox
                    value={editArtist ?? ''}
                    onChange={(v) => setEditArtist(v === '' ? null : v === 'GLOBAL' ? null : (v as ArtistGroup))}
                    options={[
                      { value: '', label: '아티스트를 선택해주세요' },
                      ...(slotMeta.targetMode === 'ARTIST_ONLY'
                        ? ACTIVE_ARTISTS.map((a) => ({ value: a, label: a }))
                        : [{ value: 'GLOBAL', label: '전역' }, ...ACTIVE_ARTISTS.map((a) => ({ value: a, label: a }))]),
                    ]}
                  />
                )}
                {artistMissing && (
                  <p className="mt-1 text-xs text-rose-600">아티스트를 선택해주세요. 선택하지 않으면 저장할 수 없습니다.</p>
                )}
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
        {ratioChanged && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            ⚠️ 권장 비율이 변경되었습니다 ({initialRatio} → {currentRatio}). 이미지 재업로드를 권장합니다.
          </div>
        )}
      </Section>

      {/* B. 기본 정보 — 다국어 */}
      <Section title="B. 기본 정보 (다국어)" description="공개일 도달 시점에 KO/EN/JP 3언어 모두 입력 + 이미지 검증. 미입력 시 자동 노출 차단.">
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
          <MultiLangRow
            label="이미지 대체 텍스트"
            max={100}
            ko={altTextKO}
            en={altTextEN}
            jp={altTextJP}
            onKO={setAltTextKO}
            onEN={setAltTextEN}
            onJP={setAltTextJP}
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
      <Section title="D. 딥링크 (선택)" description="소스 타입 분류 라벨 + 회원 앱에서 도달할 URL을 직접 입력. URL을 비우면 표시 전용 배너 (클릭 비활성)">
        <DeeplinkPicker value={deeplink} onChange={setDeeplink} disabled={readOnly} />
      </Section>

      {/* E. 노출 기간 (v6.7/v6.8 정합) — 공개일 항상 필수 + 종료일만 무기한 옵션 */}
      <Section
        title="E. 노출 기간"
        description="공개일은 항상 필수. 도달 시 시스템 자동 노출. 종료일은 '무기한' 또는 일정 지정. 도달 시 자동 종료 또는 운영자 [노출 종료] 비상 차단."
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              공개일시 (KST) <span className="text-red-500">*</span>
            </label>
            {/* v6.9 (A3): datetime-local 사용 — 브라우저 네이티브 검증으로 형식 오류 차단 */}
            <input
              type="datetime-local"
              value={openDt}
              onChange={(e) => setOpenDt(e.target.value)}
              disabled={readOnly}
              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              브라우저 시간대를 KST(서울)로 가정합니다. 지금 즉시 노출하려면 현재 시각(또는 ±몇 분)을 선택하세요.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">종료일시 (KST)</label>
            <div className="flex items-center gap-3 mb-2">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={closeUnlimited}
                  onChange={(e) => { setCloseUnlimited(e.target.checked); if (e.target.checked) setCloseDt(''); }}
                  disabled={readOnly}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="text-sm text-gray-700">무기한 (운영자가 직접 [노출 종료]로 비상 차단)</span>
              </label>
            </div>
            {!closeUnlimited && (
              <input
                type="datetime-local"
                value={closeDt}
                onChange={(e) => setCloseDt(e.target.value)}
                disabled={readOnly}
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
              />
            )}
          </div>
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
              onClick={() => onSubmit('create')}
              disabled={!canSubmit}
              className="h-10 px-4 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              생성하기
            </button>
          </>
        )}
        {mode === 'edit' && (
          <button
            type="button"
            onClick={() => onSubmit('save')}
            disabled={!hasChanged || !canSubmit}
            className="h-10 px-4 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
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
