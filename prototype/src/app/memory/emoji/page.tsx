'use client';

import { useMemo, useState } from 'react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { PlusIcon, ArrowUpIcon, ArrowDownIcon, PhotoIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import ConfirmModal from '@/components/clone/ConfirmModal';
import { toast } from '@/components/ui/Toast';
import { artistGroups } from '@/mock/artists';
import { MAX_EMOJI_PER_ARTIST, MAX_ACTIVE_EMOJI, type EmotionEmoji } from '@/mock/memoryEmoji';
import { useMemoryEmojiStore, type EmojiInput } from '@/stores/memoryEmojiStore';
import EmojiFormModal from './_components/EmojiFormModal';

// [CEB-BO-MEM-501] 감정 이모지 관리 — 아티스트별 세트 편집
const ACTIVE_GROUPS = artistGroups.filter((g) => g.status === 'Active');

export default function MemoryEmojiPage() {
  const { draft, setOf, add, update, remove, move, toggleActive, apply, revert, pendingCount, lastAppliedAt } =
    useMemoryEmojiStore();
  const [groupId, setGroupId] = useState<number>(ACTIVE_GROUPS[0]?.id ?? 1);

  // 세트 (작업본 draft 변경 즉시 반영)
  const set = useMemo(() => setOf(groupId), [draft, groupId, setOf]);
  const activeCount = set.filter((e) => e.active).length;
  const pending = useMemo(() => pendingCount(groupId), [draft, groupId, pendingCount]);
  const lastApplied = lastAppliedAt[groupId];

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editTarget, setEditTarget] = useState<EmotionEmoji | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<EmotionEmoji | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [revertOpen, setRevertOpen] = useState(false);

  const groupName = ACTIVE_GROUPS.find((g) => g.id === groupId)?.name ?? '';
  const atMax = set.length >= MAX_EMOJI_PER_ARTIST;

  const openCreate = () => {
    if (atMax) return;
    setFormMode('create');
    setEditTarget(undefined);
    setFormOpen(true);
  };
  const openEdit = (e: EmotionEmoji) => {
    setFormMode('edit');
    setEditTarget(e);
    setFormOpen(true);
  };

  const handleSubmit = (data: EmojiInput) => {
    if (formMode === 'create') {
      add(groupId, data);
      toast.success('감정 이모지를 추가했습니다.');
    } else if (editTarget) {
      update(editTarget.id, data);
      toast.success('감정 이모지를 수정했습니다.');
    }
    setFormOpen(false);
  };

  const handleDeleteClick = (e: EmotionEmoji) => {
    // 회원 사용 이력(inUse) 또는 사용 상태(active)면 [삭제] 비활성 — 안전장치
    if (e.inUse || e.active) return;
    setDeleteTarget(e);
  };
  const confirmDelete = () => {
    if (deleteTarget) {
      remove(deleteTarget.id);
      toast.success('감정 이모지를 삭제했습니다.');
      setDeleteTarget(null);
    }
  };

  const handleToggle = (e: EmotionEmoji) => {
    if (!e.active && activeCount >= MAX_ACTIVE_EMOJI) {
      toast.error(`사용은 최대 ${MAX_ACTIVE_EMOJI}개까지 가능합니다. 다른 이모지를 미사용으로 전환하세요.`);
      return;
    }
    const next = toggleActive(e.id);
    toast.success(next ? '사용으로 전환했습니다.' : '미사용으로 전환했습니다.');
  };

  const confirmApply = () => {
    apply(groupId);
    toast.success('변경사항을 앱에 적용했습니다.');
    setApplyOpen(false);
  };
  const confirmRevert = () => {
    revert(groupId);
    toast.success('미적용 변경을 되돌렸습니다.');
    setRevertOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="감정 이모지 관리"
        breadcrumbItems={[{ label: '기억저장소' }, { label: '감정 이모지 관리' }]}
        actions={
          <button
            onClick={openCreate}
            disabled={atMax}
            className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="w-4 h-4" />감정 이모지 추가
          </button>
        }
      />

      {/* 변경사항 적용 바 — 편집은 적용 전까지 앱에 반영되지 않음 */}
      <div className="flex items-center justify-between gap-3 mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="text-sm">
          {pending > 0 ? (
            <span className="font-medium text-amber-700">미적용 변경 {pending}건 — 앱에 반영하려면 [변경사항 적용]을 누르세요.</span>
          ) : (
            <span className="text-gray-500">모든 변경이 적용되었습니다.</span>
          )}
          <span className="ml-2 text-xs text-gray-400">마지막 적용 {lastApplied ?? '—'}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setRevertOpen(true)}
            disabled={pending === 0}
            className="h-9 px-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            되돌리기
          </button>
          <button
            onClick={() => setApplyOpen(true)}
            disabled={pending === 0}
            className="h-9 px-4 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            변경사항 적용
          </button>
        </div>
      </div>

      {/* 아티스트 선택 + 세트 요약 */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative">
          <select
            value={groupId}
            onChange={(e) => setGroupId(Number(e.target.value))}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[220px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {ACTIVE_GROUPS.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <p className="text-sm text-gray-500">
          등록 <span className="font-semibold text-gray-900">{set.length}</span> / {MAX_EMOJI_PER_ARTIST}종
          <span className="mx-2 text-gray-300">·</span>
          사용 <span className="font-semibold text-emerald-600">{activeCount}</span> / {MAX_ACTIVE_EMOJI}종
        </p>
      </div>

      {atMax && (
        <p className="mb-3 text-xs text-amber-600">최대 {MAX_EMOJI_PER_ARTIST}종까지 등록할 수 있습니다. 추가하려면 기존 이모지를 삭제하세요.</p>
      )}

      {/* 세트 표 */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="text-left font-medium px-4 py-3 w-[90px]">순서</th>
              <th className="text-left font-medium px-4 py-3 w-[80px]">이모지</th>
              <th className="text-left font-medium px-4 py-3">라벨 (한국어 / 영어 / 일본어)</th>
              <th className="text-left font-medium px-4 py-3 w-[120px]">사용여부</th>
              <th className="text-right font-medium px-4 py-3 w-[120px]">관리</th>
            </tr>
          </thead>
          <tbody>
            {set.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">
                  등록된 감정 이모지가 없습니다. [감정 이모지 추가]로 등록하세요. (기본 6종 프리셋 권장)
                </td>
              </tr>
            ) : (
              set.map((e, idx) => (
                <tr key={e.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="w-6 text-gray-500">{e.order}</span>
                      <button
                        onClick={() => move(e.id, 'up')}
                        disabled={idx === 0}
                        className="w-7 h-7 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="위로"
                      >
                        <ArrowUpIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => move(e.id, 'down')}
                        disabled={idx === set.length - 1}
                        className="w-7 h-7 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="아래로"
                      >
                        <ArrowDownIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {e.imageSrc ? (
                      <span className="inline-flex items-center gap-1.5" title={e.imageSrc}>
                        <span className="w-8 h-8 inline-flex items-center justify-center rounded-md bg-indigo-50 border border-indigo-100">
                          <PhotoIcon className="w-4 h-4 text-indigo-400" />
                        </span>
                        <span className="text-[11px] text-gray-400">이미지</span>
                      </span>
                    ) : (
                      <span className="text-2xl">{e.emoji}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{e.labelKO}</span>
                    <span className="text-gray-400"> / {e.labelEN} / {e.labelJA}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(e)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        e.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${e.active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      {e.active ? '사용' : '미사용'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(e)} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">수정</button>
                    <span className="mx-2 text-gray-200">|</span>
                    <button
                      onClick={() => handleDeleteClick(e)}
                      disabled={e.inUse || e.active}
                      title={e.inUse ? '회원이 사용한 이모지는 삭제할 수 없습니다' : e.active ? '사용 중인 이모지는 미사용으로 전환 후 삭제할 수 있습니다' : ''}
                      className={`text-sm font-medium ${!e.inUse && !e.active ? 'text-rose-600 hover:text-rose-700' : 'text-gray-300 cursor-not-allowed'}`}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        표시 순서가 앱의 감정 선택지 노출 순서입니다. 회원은 기억 작성 시 1개를 선택합니다. 규격은 공통 정책([CEB-000] §7.5)을 따릅니다.
      </p>

      <EmojiFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        mode={formMode}
        initial={editTarget}
        siblings={set}
        canEnableActive={editTarget?.active ? true : activeCount < MAX_ACTIVE_EMOJI}
        onSubmit={handleSubmit}
      />

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="감정 이모지 삭제"
        lines={[
          `'${deleteTarget?.labelKO ?? ''}' ${deleteTarget?.imageSrc ? '(커스텀 이미지)' : (deleteTarget?.emoji ?? '')} 이모지를 삭제할까요?`,
          `${groupName} 세트에서 제거되며 복구할 수 없습니다.`,
        ]}
        confirmLabel="삭제"
        cancelLabel="취소"
      />

      <ConfirmModal
        isOpen={applyOpen}
        onClose={() => setApplyOpen(false)}
        onConfirm={confirmApply}
        title="변경사항 적용"
        lines={[
          `${groupName}의 감정 이모지 변경 ${pending}건을 앱에 적용할까요?`,
          '적용 즉시 회원 앱에 반영됩니다.',
        ]}
        confirmLabel="적용"
        cancelLabel="취소"
      />

      <ConfirmModal
        isOpen={revertOpen}
        onClose={() => setRevertOpen(false)}
        onConfirm={confirmRevert}
        title="변경 되돌리기"
        lines={[
          `미적용 변경 ${pending}건을 모두 되돌릴까요?`,
          '마지막 적용 상태로 복원되며 작업 내용은 사라집니다.',
        ]}
        confirmLabel="되돌리기"
        cancelLabel="취소"
      />
    </div>
  );
}
