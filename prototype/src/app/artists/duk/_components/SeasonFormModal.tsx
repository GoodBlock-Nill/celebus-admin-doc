'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { dukActiveGroups, type DukSeason } from '@/mock/duk';

// [CEB-BO-ART-401] §2-1 C. 시즌 생성·수정 모달
// - 생성 모드: 그룹 Dropdown 활성
// - 수정 모드: 그룹 readonly + 시즌명·기간 prefill
// - 검증: 시즌명 1~50자, 종료 > 시작

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initial?: DukSeason;
  existingActiveSeasons: DukSeason[]; // 동일 그룹 진행중 시즌 1개 제한 검증용
  onSubmit: (data: { artistGroupId: number; name: string; startAt: string; endAt: string }) => void;
}

// YYYY.MM.DD HH:mm <-> "YYYY-MM-DDTHH:mm" 변환 (input[type=datetime-local])
function toLocalInput(v: string): string {
  if (!v) return '';
  // "2026.04.01 00:00" → "2026-04-01T00:00"
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

export default function SeasonFormModal({ isOpen, onClose, mode, initial, existingActiveSeasons, onSubmit }: Props) {
  const [groupId, setGroupId] = useState<number>(dukActiveGroups[0].id);
  const [name, setName] = useState('');
  const [startAt, setStartAt] = useState(''); // input value
  const [endAt, setEndAt] = useState('');

  useEffect(() => {
    if (isOpen) {
      setGroupId(initial?.artistGroupId ?? dukActiveGroups[0].id);
      setName(initial?.name ?? '');
      setStartAt(toLocalInput(initial?.startAt ?? ''));
      setEndAt(toLocalInput(initial?.endAt ?? ''));
    }
  }, [isOpen, initial]);

  const isEdit = mode === 'edit';
  const title = isEdit ? '시즌 수정' : '신규 시즌';

  const nameValid = name.trim().length >= 1 && name.trim().length <= 50;
  const dateValid = !!startAt && !!endAt && startAt < endAt;
  // 그룹별 진행중 시즌 1개 제한 — 생성 모드일 때 동일 그룹에 진행중 시즌 있으면 차단
  const conflict =
    !isEdit && existingActiveSeasons.some((s) => s.artistGroupId === groupId);
  const canSubmit = nameValid && dateValid && !conflict;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      artistGroupId: groupId,
      name: name.trim(),
      startAt: fromLocalInput(startAt),
      endAt: fromLocalInput(endAt),
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
          {conflict && (
            <p className="text-xs text-rose-600 mt-1">
              해당 그룹에 이미 진행중인 시즌이 있습니다. (그룹별 진행중 시즌 1개 제한)
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            시즌명 <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: V01D 2026 1Q 시즌"
            maxLength={50}
            className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">1~50자</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              시작일시 <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              종료일시 <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        {startAt && endAt && startAt >= endAt && (
          <p className="text-xs text-rose-600">종료일시는 시작일시보다 미래여야 합니다.</p>
        )}
      </div>
    </Modal>
  );
}
