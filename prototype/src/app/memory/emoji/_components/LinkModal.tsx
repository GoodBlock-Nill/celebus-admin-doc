'use client';

import { useState, useMemo } from 'react';
import { PhotoIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { MAX_LINK_PER_ARTIST } from '@/mock/memoryEmoji';
import { useMemoryEmojiStore, type LibraryEmojiInput } from '@/stores/memoryEmojiStore';
import LibraryEmojiFormModal from './LibraryEmojiFormModal';

// [CEB-BO-MEM-501-MD-LINK] 이모지 연결 모달
// - 라이브러리에서 다중 선택 → linkEmojis 호출
// - 이미 연결된 항목은 "연결됨" 배지로 비활성 표시
// - "신규 등록" → LibraryEmojiFormModal(create) 연동

interface Props {
  isOpen: boolean;
  onClose: () => void;
  artistGroupId: number;
  artistGroupName: string;
  currentLinkCount: number;
  onLinked?: () => void;
}

export default function LinkModal({ isOpen, onClose, artistGroupId, artistGroupName, currentLinkCount, onLinked }: Props) {
  const { library, linksDraft, linkEmojis, addLibraryEmoji } = useMemoryEmojiStore();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [registerOpen, setRegisterOpen] = useState(false);

  // 이미 연결된 emojiId 집합 (draft 기준)
  const linkedEmojiIds = useMemo(
    () => new Set(linksDraft.filter((l) => l.artistGroupId === artistGroupId).map((l) => l.emojiId)),
    [linksDraft, artistGroupId],
  );

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

  const totalAfter = currentLinkCount + selected.size;
  const overLimit = totalAfter > MAX_LINK_PER_ARTIST;

  const toggleSelect = (id: number) => {
    if (linkedEmojiIds.has(id)) return; // 이미 연결됨 — 선택 불가
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleLink = () => {
    if (selected.size === 0 || overLimit) return;
    linkEmojis(artistGroupId, Array.from(selected));
    toast.success(`${selected.size}개 이모지를 연결했습니다.`);
    setSelected(new Set());
    onLinked?.();
    onClose();
  };

  const handleRegisterSubmit = (data: LibraryEmojiInput) => {
    addLibraryEmoji(data);
    toast.success('감정 이모지를 등록했습니다.');
    setRegisterOpen(false);
  };

  // 모달 닫힐 때 상태 초기화
  const handleClose = () => {
    setSearch('');
    setSelected(new Set());
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={`이모지 연결 — ${artistGroupName}`}
        width="max-w-lg"
        footer={
          <>
            <button
              onClick={handleClose}
              className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleLink}
              disabled={selected.size === 0 || overLimit}
              className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              연결 ({selected.size}개)
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* 안내 */}
          <p className="text-sm text-gray-500">
            라이브러리에서 연결할 이모지를 선택하세요.{' '}
            <span className="font-medium text-gray-700">(연결 {currentLinkCount}/{MAX_LINK_PER_ARTIST})</span>
          </p>

          {overLimit && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              연결은 최대 {MAX_LINK_PER_ARTIST}종까지 가능합니다. 선택을 줄여주세요.
            </p>
          )}

          {/* 검색 */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="라벨로 검색 (한/영/일)"
              className="w-full h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 라이브러리 그리드 */}
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">검색 결과가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
              {filtered.map((emoji) => {
                const isLinked = linkedEmojiIds.has(emoji.id);
                const isSelected = selected.has(emoji.id);
                return (
                  <button
                    key={emoji.id}
                    type="button"
                    onClick={() => toggleSelect(emoji.id)}
                    disabled={isLinked}
                    className={`relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors ${
                      isLinked
                        ? 'border-gray-100 bg-gray-50 cursor-not-allowed'
                        : isSelected
                          ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                    }`}
                  >
                    {/* 이미지 프레임 */}
                    <span className="w-12 h-12 inline-flex items-center justify-center rounded-lg bg-gray-100 border border-gray-200">
                      <PhotoIcon className={`w-6 h-6 ${isSelected ? 'text-indigo-400' : 'text-gray-400'}`} />
                    </span>
                    <span className={`text-xs font-medium leading-tight ${isLinked ? 'text-gray-400' : 'text-gray-800'}`}>
                      {emoji.labelKO}
                    </span>
                    {isLinked && (
                      <span className="absolute top-1.5 right-1.5 text-[10px] font-medium text-gray-400 bg-gray-100 rounded px-1 py-0.5">
                        연결됨
                      </span>
                    )}
                    {isSelected && !isLinked && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* 신규 등록 유도 */}
          <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5">
            <p className="text-xs text-gray-500">원하는 이모지가 없나요?</p>
            <button
              type="button"
              onClick={() => setRegisterOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              신규 등록
            </button>
          </div>
        </div>
      </Modal>

      {/* 신규 등록 모달 (중첩) */}
      <LibraryEmojiFormModal
        isOpen={registerOpen}
        onClose={() => setRegisterOpen(false)}
        mode="create"
        onSubmit={handleRegisterSubmit}
      />
    </>
  );
}
