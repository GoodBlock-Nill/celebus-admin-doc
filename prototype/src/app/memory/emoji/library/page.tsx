'use client';

import { useMemo, useState } from 'react';
import { PlusIcon, PhotoIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import ConfirmModal from '@/components/clone/ConfirmModal';
import { toast } from '@/components/ui/Toast';
import { useMemoryEmojiStore, type LibraryEmojiInput } from '@/stores/memoryEmojiStore';
import type { LibraryEmoji } from '@/mock/memoryEmoji';
import LibraryEmojiFormModal from '../_components/LibraryEmojiFormModal';

// [CEB-BO-MEM-502] 감정 이모지 라이브러리 — 전역 이모지 등록·수정·삭제

export default function EmojiLibraryPage() {
  const { library, linkedArtistCount, addLibraryEmoji, updateLibraryEmoji, deleteLibraryEmoji } =
    useMemoryEmojiStore();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editTarget, setEditTarget] = useState<LibraryEmoji | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<LibraryEmoji | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return library;
    return library.filter(
      (e) =>
        e.labelKO.toLowerCase().includes(q) ||
        e.labelEN.toLowerCase().includes(q) ||
        e.labelJA.toLowerCase().includes(q),
    );
  }, [library, search]);

  const openCreate = () => {
    setFormMode('create');
    setEditTarget(undefined);
    setFormOpen(true);
  };

  const openEdit = (emoji: LibraryEmoji) => {
    setFormMode('edit');
    setEditTarget(emoji);
    setFormOpen(true);
  };

  const handleFormSubmit = (data: LibraryEmojiInput) => {
    if (formMode === 'create') {
      addLibraryEmoji(data);
      toast.success('감정 이모지를 등록했습니다.');
    } else if (editTarget) {
      updateLibraryEmoji(editTarget.id, data);
      toast.success('감정 이모지를 수정했습니다.');
    }
    setFormOpen(false);
  };

  const handleDeleteClick = (emoji: LibraryEmoji) => {
    const count = linkedArtistCount(emoji.id);
    if (count > 0 || emoji.memberUsed) return; // 비활성 버튼 — 클릭 방어
    setDeleteTarget(emoji);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteLibraryEmoji(deleteTarget.id);
    toast.success('감정 이모지를 삭제했습니다.');
    setDeleteTarget(null);
  };

  return (
    <div>
      <PageHeader
        title="감정 이모지 라이브러리"
        breadcrumbItems={[{ label: '기억저장소' }, { label: '감정 이모지 라이브러리' }]}
        actions={
          <button
            onClick={openCreate}
            className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            <PlusIcon className="w-4 h-4" />이모지 등록
          </button>
        }
      />

      {/* 검색 */}
      <div className="relative mb-4 max-w-sm">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="라벨로 검색 (한/영/일)"
          className="w-full h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* 라이브러리 표 */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="text-left font-medium px-4 py-3 w-[80px]">이미지</th>
              <th className="text-left font-medium px-4 py-3">라벨 (한국어 / 영어 / 일본어)</th>
              <th className="text-left font-medium px-4 py-3 w-[140px]">연결 아티스트</th>
              <th className="text-right font-medium px-4 py-3 w-[120px]">관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-400">
                  {search ? '검색 결과가 없습니다.' : '등록된 감정 이모지가 없습니다. [이모지 등록]으로 추가하세요.'}
                </td>
              </tr>
            ) : (
              filtered.map((emoji) => {
                const count = linkedArtistCount(emoji.id);
                const canDelete = count === 0 && !emoji.memberUsed;
                const deleteTitle = emoji.memberUsed
                  ? '회원 사용 이력이 있어 삭제할 수 없습니다'
                  : count > 0
                    ? `${count}개 아티스트에 연결되어 있어 삭제할 수 없습니다`
                    : '';
                return (
                  <tr key={emoji.id} className="border-t border-gray-100">
                    {/* 이미지 */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5" title={emoji.imageSrc}>
                        <span className="w-10 h-10 inline-flex items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100">
                          <PhotoIcon className="w-5 h-5 text-indigo-400" />
                        </span>
                      </span>
                    </td>
                    {/* 라벨 */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{emoji.labelKO}</span>
                      <span className="text-gray-400"> / {emoji.labelEN} / {emoji.labelJA}</span>
                      {emoji.isPreset && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600 border border-indigo-100">
                          기본 제공
                        </span>
                      )}
                    </td>
                    {/* 연결 아티스트 수 */}
                    <td className="px-4 py-3">
                      <span className={`text-sm ${count > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                        {count > 0 ? `${count}개 아티스트` : '—'}
                      </span>
                    </td>
                    {/* 관리 */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(emoji)}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        수정
                      </button>
                      <span className="mx-2 text-gray-200">|</span>
                      <button
                        onClick={() => handleDeleteClick(emoji)}
                        disabled={!canDelete}
                        title={deleteTitle}
                        className={`text-sm font-medium ${canDelete ? 'text-rose-600 hover:text-rose-700' : 'text-gray-300 cursor-not-allowed'}`}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 등록·수정 모달 */}
      <LibraryEmojiFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        mode={formMode}
        initial={editTarget}
        linkedCount={editTarget ? linkedArtistCount(editTarget.id) : 0}
        onSubmit={handleFormSubmit}
      />

      {/* 삭제 확인 */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="이모지 삭제"
        lines={[
          `'${deleteTarget?.labelKO ?? ''}' 이모지를 라이브러리에서 삭제할까요?`,
          '전역에서 영구 제거되며 복구할 수 없습니다.',
        ]}
        confirmLabel="삭제"
        cancelLabel="취소"
      />
    </div>
  );
}
