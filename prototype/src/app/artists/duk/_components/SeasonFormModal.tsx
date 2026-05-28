'use client';

import { useEffect, useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { dukActiveGroups, type DukSeason } from '@/mock/duk';

// [CEB-BO-ART-401] v1.8 §2-1 C. 시즌 생성·수정 모달
// - 시즌 1년 고정: 시작일시만 입력, 종료 = 시작 + 1년 자동 산출
// - 생성 모드: 그룹 Dropdown 활성 / 수정 모드: 그룹 readonly
// - v1.7: 수정 모드 + 진행중·종료 시즌 → 시작일 readonly (12개월 시퀀스 매칭 깨짐 방지)
// - v1.8: 시즌명·시작일시 필드별 인라인 에러 (touched 후 노출)

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initial?: DukSeason;
  existingSeasons: DukSeason[]; // 동일 그룹 기간 겹침 검증용
  onSubmit: (data: { artistGroupId: number; name: string; startAt: string; endAt: string }) => void;
}

// "YYYY.MM.DD HH:mm" <-> "YYYY-MM-DDTHH:mm"
function toLocalInput(v: string): string {
  if (!v) return '';
  const m = v.match(/^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!m) return '';
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}`;
}
function fromLocalInput(v: string): string {
  if (!v) return '';
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return '';
  return `${m[1]}.${m[2]}.${m[3]} ${m[4]}:${m[5]}`;
}

// 시작 "YYYY.MM.DD HH:mm"으로부터 +1년 - 1분 (= 다음 해 같은 날의 직전 분) "YYYY.MM.DD HH:mm"
function addOneYearMinusMinute(startDot: string): string {
  const m = startDot.match(/^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!m) return '';
  const d = new Date(Number(m[1]) + 1, Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  d.setMinutes(d.getMinutes() - 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function SeasonFormModal({
  isOpen,
  onClose,
  mode,
  initial,
  existingSeasons,
  onSubmit,
}: Props) {
  const [groupId, setGroupId] = useState<number>(dukActiveGroups[0].id);
  const [name, setName] = useState('');
  const [startAt, setStartAt] = useState(''); // input value (datetime-local)
  // v1.8 — 인라인 검증용 touched state (포커스 후 첫 이탈 시 true)
  const [nameTouched, setNameTouched] = useState(false);
  const [startTouched, setStartTouched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGroupId(initial?.artistGroupId ?? dukActiveGroups[0].id);
      setName(initial?.name ?? '');
      setStartAt(toLocalInput(initial?.startAt ?? ''));
      // 모달 재진입 시 touched 초기화
      setNameTouched(false);
      setStartTouched(false);
    }
  }, [isOpen, initial]);

  const isEdit = mode === 'edit';
  const title = isEdit ? '시즌 수정' : '신규 시즌';
  // v1.7 — 진행중·종료 시즌은 시작일 readonly (12개월 시퀀스 매칭 깨짐 방지)
  const startReadonly = isEdit && (initial?.status === '진행중' || initial?.status === '종료');

  // 종료 자동 산출 (시작 + 1년)
  const computedEndDot = useMemo(() => {
    const startDot = fromLocalInput(startAt);
    if (!startDot) return '';
    return addOneYearMinusMinute(startDot);
  }, [startAt]);

  const nameValid = name.trim().length >= 1 && name.trim().length <= 50;
  const dateValid = !!startAt && !!computedEndDot;
  // v1.8 — 인라인 에러 메시지
  const nameError = nameTouched && name.trim().length === 0 ? '시즌명을 입력하세요' : null;
  const startError = startTouched && !startAt ? '시작일시를 선택하세요' : null;

  // 동일 그룹의 다른 시즌과 기간 겹침 검증 (1년 고정으로 충돌 검증 단순화)
  const conflict = useMemo(() => {
    if (!dateValid) return false;
    const startDot = fromLocalInput(startAt);
    return existingSeasons.some((s) => {
      if (s.artistGroupId !== groupId) return false;
      if (isEdit && initial && s.id === initial.id) return false;
      // 기간 겹침 판정 — [startDot, computedEndDot] vs [s.startAt, s.endAt]
      return !(computedEndDot < s.startAt || startDot > s.endAt);
    });
  }, [dateValid, startAt, computedEndDot, groupId, existingSeasons, isEdit, initial]);

  // 동일 그룹 진행중 시즌 1개 제약 (MD-SEASON §5.2 정합)
  // 생성 모드에서만 적용. 같은 그룹에 진행중 시즌이 이미 있으면 차단
  const activeSeasonExists = useMemo(() => {
    if (isEdit) return false;
    return existingSeasons.some((s) => s.artistGroupId === groupId && s.status === '진행중');
  }, [isEdit, groupId, existingSeasons]);

  const canSubmit = nameValid && dateValid && !conflict && !activeSeasonExists;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      artistGroupId: groupId,
      name: name.trim(),
      startAt: fromLocalInput(startAt),
      endAt: computedEndDot,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      width="max-w-md"
      footer={
        <>
          <button
            onClick={onClose}
            className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            저장
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            그룹 <span className="text-red-500">*</span>
          </label>
          {isEdit ? (
            <div className="h-10 w-full px-3 inline-flex items-center border border-gray-100 rounded-lg bg-gray-50 text-sm text-gray-700">
              {dukActiveGroups.find((g) => g.id === groupId)?.name ?? '—'}
            </div>
          ) : (
            <select
              value={groupId}
              onChange={(e) => setGroupId(Number(e.target.value))}
              className="h-10 w-full px-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {dukActiveGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            시즌명 <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setNameTouched(true)}
            placeholder="예: V01D 2026 시즌"
            maxLength={50}
            className={`h-10 w-full px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
              nameError
                ? 'border-rose-300 focus:ring-rose-500'
                : 'border-gray-200 focus:ring-indigo-500'
            }`}
          />
          {nameError ? (
            <p className="text-xs text-rose-600 mt-1">{nameError}</p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">1~50자 ({name.length}/50)</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            시작일시 <span className="text-red-500">*</span>
          </label>
          {startReadonly ? (
            <>
              <div className="h-10 w-full px-3 inline-flex items-center border border-gray-100 rounded-lg bg-gray-50 text-sm text-gray-700">
                {initial?.startAt ?? '—'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                진행중·종료 시즌은 시작일을 변경할 수 없습니다 (12개월 보상 시퀀스 보호)
              </p>
            </>
          ) : (
            <>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                onBlur={() => setStartTouched(true)}
                className={`h-10 w-full px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                  startError
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-gray-200 focus:ring-indigo-500'
                }`}
              />
              {startError && (
                <p className="text-xs text-rose-600 mt-1">{startError}</p>
              )}
            </>
          )}
        </div>

        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
          <p className="text-xs text-gray-500 mb-0.5">종료일시 (시작 + 1년 자동)</p>
          <p className="text-sm font-medium text-gray-800">{computedEndDot || '시작일시를 선택해 주세요.'}</p>
        </div>

        {conflict && (
          <p className="text-xs text-rose-600">
            해당 기간이 같은 그룹의 다른 시즌과 겹칩니다. (그룹별 시즌은 기간 중복 불가)
          </p>
        )}
        {activeSeasonExists && (
          <p className="text-xs text-rose-600">
            해당 그룹에 이미 진행중인 시즌이 있습니다. 진행중 시즌은 그룹당 1개만 운영할 수 있습니다.
          </p>
        )}
      </div>
    </Modal>
  );
}
