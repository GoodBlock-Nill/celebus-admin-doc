'use client';

import { useEffect, useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { dukActiveGroups, type DukSeason } from '@/mock/duk';

// [CEB-BO-ART-401-MD-SEASON] 시즌 생성·수정 모달
// - 시즌 = 1개월 단위: 연도 + 월 선택 → 시작 {연}.{월}.01 00:00 ~ 종료 말일 23:59 자동 산출
// - 생성 모드: 그룹 Dropdown 활성 / 수정 모드: 그룹 readonly
// - 진행중·종료 시즌 → 연도·월 readonly (보상·정산 데이터 매칭 깨짐 방지)
// - 시즌명은 그룹·연도·월에 맞춰 자동 제안(수동 수정 가능)

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initial?: DukSeason;
  existingSeasons: DukSeason[]; // 동일 그룹 기간 겹침 검증용
  onSubmit: (data: { artistGroupId: number; name: string; startAt: string; endAt: string }) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// "YYYY.MM.DD HH:mm" → { year, month }
function parseYearMonth(v?: string): { year: number; month: number } | null {
  if (!v) return null;
  const m = v.match(/^(\d{4})\.(\d{2})/);
  return m ? { year: Number(m[1]), month: Number(m[2]) } : null;
}

// {연}.{월}.01 00:00 ~ 말일 23:59 (= 다음 달 1일 00:00 직전 1분)
function seasonRange(year: number, month: number): { startDot: string; endDot: string } {
  const startDot = `${year}.${pad(month)}.01 00:00`;
  const end = new Date(year, month, 1, 0, 0); // 다음 달 1일 00:00 (month는 1-indexed → 0-indexed 다음 달)
  end.setMinutes(end.getMinutes() - 1);
  const endDot = `${end.getFullYear()}.${pad(end.getMonth() + 1)}.${pad(end.getDate())} ${pad(end.getHours())}:${pad(end.getMinutes())}`;
  return { startDot, endDot };
}

function suggestName(groupId: number, year: number, month: number): string {
  const g = dukActiveGroups.find((x) => x.id === groupId)?.name ?? '';
  return `${g} ${year}.${pad(month)} 시즌`;
}

export default function SeasonFormModal({
  isOpen,
  onClose,
  mode,
  initial,
  existingSeasons,
  onSubmit,
}: Props) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [groupId, setGroupId] = useState<number>(dukActiveGroups[0].id);
  const [year, setYear] = useState<number>(currentYear);
  const [month, setMonth] = useState<number>(currentMonth);
  const [name, setName] = useState('');
  const [nameManual, setNameManual] = useState(false); // 사용자가 시즌명 직접 수정했는지
  const [nameTouched, setNameTouched] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const gid = initial?.artistGroupId ?? dukActiveGroups[0].id;
    const ym = parseYearMonth(initial?.startAt) ?? { year: currentYear, month: currentMonth };
    setGroupId(gid);
    setYear(ym.year);
    setMonth(ym.month);
    setName(initial?.name ?? suggestName(gid, ym.year, ym.month));
    setNameManual(mode === 'edit'); // 수정 모드는 기존 이름 보존(자동 덮어쓰기 안 함)
    setNameTouched(false);
  }, [isOpen, initial, mode, currentYear, currentMonth]);

  const isEdit = mode === 'edit';
  const title = isEdit ? '시즌 수정' : '신규 시즌';
  // 진행중·종료 시즌은 연도·월 readonly (보상·정산 데이터 매칭 깨짐 방지)
  const periodReadonly = isEdit && (initial?.status === '진행중' || initial?.status === '종료');

  // 연도 선택 옵션 — 현재·다음 연도 + (수정 시) 기존 시즌 연도
  const yearOptions = useMemo(() => {
    const set = new Set<number>([currentYear, currentYear + 1]);
    const ym = parseYearMonth(initial?.startAt);
    if (ym) set.add(ym.year);
    set.add(year);
    return [...set].sort((a, b) => a - b);
  }, [currentYear, initial, year]);

  // 그룹·연도·월 변경 시 시즌명 자동 제안 (사용자가 직접 수정하지 않은 경우만)
  useEffect(() => {
    if (!isOpen || isEdit || nameManual) return;
    setName(suggestName(groupId, year, month));
  }, [isOpen, isEdit, nameManual, groupId, year, month]);

  const { startDot, endDot } = useMemo(() => {
    if (periodReadonly && initial) return { startDot: initial.startAt, endDot: initial.endAt };
    return seasonRange(year, month);
  }, [periodReadonly, initial, year, month]);

  const nameValid = name.trim().length >= 1 && name.trim().length <= 50;
  const nameError = nameTouched && name.trim().length === 0 ? '시즌명을 입력하세요' : null;

  // ① 지난 월 차단 — 선택 연·월이 현재 연·월보다 이전이면 생성 불가 (현재·미래만)
  // 진행중·종료 시즌 수정(연·월 readonly)은 검사 제외
  const isPastMonth = useMemo(() => {
    if (periodReadonly) return false;
    return year < currentYear || (year === currentYear && month < currentMonth);
  }, [periodReadonly, year, month, currentYear, currentMonth]);

  // ② 동일 월 시즌 존재 — 시즌은 그룹×월 1:1이므로 같은 그룹·같은 월 시즌이 있으면 차단 (수정 시 자기 제외)
  const sameMonthSeason = useMemo(() => {
    if (periodReadonly) return undefined;
    return existingSeasons.find((s) => {
      if (s.artistGroupId !== groupId) return false;
      if (isEdit && initial && s.id === initial.id) return false;
      const ym = parseYearMonth(s.startAt);
      return ym?.year === year && ym?.month === month;
    });
  }, [periodReadonly, existingSeasons, groupId, year, month, isEdit, initial]);

  // 차단 메시지 — 지난 월 > 동일 월(상태) 우선순위로 하나만 노출
  const blockMessage = isPastMonth
    ? '지난 월은 시즌을 생성할 수 없습니다. 현재 또는 이후 월을 선택하세요.'
    : sameMonthSeason
      ? sameMonthSeason.status === '진행중'
        ? '이 달에는 이미 진행중인 시즌이 있습니다.'
        : sameMonthSeason.status === '예정'
          ? '이 달에는 이미 예정된 시즌이 등록돼 있습니다.'
          : '이 달에는 이미 종료된 시즌이 있습니다.'
      : null;

  const canSubmit = nameValid && !isPastMonth && !sameMonthSeason;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ artistGroupId: groupId, name: name.trim(), startAt: startDot, endAt: endDot });
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

        {/* 시즌 기간 — 연도 + 월 선택 (시즌 = 1개월) */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            시즌 (연도 · 월) <span className="text-red-500">*</span>
          </label>
          {periodReadonly ? (
            <>
              <div className="h-10 w-full px-3 inline-flex items-center border border-gray-100 rounded-lg bg-gray-50 text-sm text-gray-700">
                {year}년 {month}월
              </div>
              <p className="text-xs text-gray-500 mt-1">
                진행중·종료 시즌은 기간을 변경할 수 없습니다 (보상·정산 데이터 보호)
              </p>
            </>
          ) : (
            <div className="flex gap-2">
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="h-10 flex-1 px-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                ))}
              </select>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="h-10 flex-1 px-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}월
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            시즌명 <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameManual(true);
            }}
            onBlur={() => setNameTouched(true)}
            placeholder="예: V01D 2026.06 시즌"
            maxLength={50}
            className={`h-10 w-full px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
              nameError ? 'border-rose-300 focus:ring-rose-500' : 'border-gray-200 focus:ring-indigo-500'
            }`}
          />
          {nameError ? (
            <p className="text-xs text-rose-600 mt-1">{nameError}</p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">연도·월 선택에 맞춰 자동 제안됩니다. 직접 수정 가능 ({name.length}/50)</p>
          )}
        </div>

        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
          <p className="text-xs text-gray-500 mb-0.5">시즌 기간 (1개월 자동 산출)</p>
          <p className="text-sm font-medium text-gray-800">{startDot} ~ {endDot}</p>
        </div>

        {/* 차단 사유는 하나만 노출 — 지난 월 > 동일 월(상태) 우선순위 */}
        {blockMessage && <p className="text-xs text-rose-600">{blockMessage}</p>}
      </div>
    </Modal>
  );
}
