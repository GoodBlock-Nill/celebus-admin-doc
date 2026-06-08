'use client';

import { useMemo, useState } from 'react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { LinkIcon, ArrowUpIcon, ArrowDownIcon, PhotoIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import ConfirmModal from '@/components/clone/ConfirmModal';
import { toast } from '@/components/ui/Toast';
import { artistGroups } from '@/mock/artists';
import { MAX_LINK_PER_ARTIST, MAX_ACTIVE_EMOJI } from '@/mock/memoryEmoji';
import { useMemoryEmojiStore } from '@/stores/memoryEmojiStore';
import LinkModal from './_components/LinkModal';

// [CEB-BO-MEM-501] 감정 이모지 연결 관리 — 아티스트별 연결·순서·사용여부 편집

const ACTIVE_GROUPS = artistGroups.filter((g) => g.status === 'Active');

export default function MemoryEmojiPage() {
  const {
    linksDraft,
    linkedSetOf,
    moveLink,
    toggleActive,
    unlink,
    applyLinks,
    revertLinks,
    pendingCount,
    lastAppliedAt,
  } = useMemoryEmojiStore();

  const [groupId, setGroupId] = useState<number>(ACTIVE_GROUPS[0]?.id ?? 1);
  const groupName = ACTIVE_GROUPS.find((g) => g.id === groupId)?.name ?? '';

  const linkedSet = useMemo(() => linkedSetOf(groupId), [linksDraft, groupId, linkedSetOf]);
  const activeCount = linkedSet.filter((item) => item.link.active).length;
  const pending = useMemo(() => pendingCount(groupId), [linksDraft, groupId, pendingCount]);
  const lastApplied = lastAppliedAt[groupId];
  const atMax = linkedSet.length >= MAX_LINK_PER_ARTIST;

  const [linkOpen, setLinkOpen] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<{ linkId: number; labelKO: string } | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [revertOpen, setRevertOpen] = useState(false);

  const handleToggle = (linkId: number, currentActive: boolean) => {
    if (!currentActive && activeCount >= MAX_ACTIVE_EMOJI) {
      toast.error(`사용은 최대 ${MAX_ACTIVE_EMOJI}개까지 가능합니다. 다른 이모지를 미사용으로 전환하세요.`);
      return;
    }
    const ok = toggleActive(linkId);
    if (ok) {
      toast.success(currentActive ? '미사용으로 전환했습니다.' : '사용으로 전환했습니다.');
    }
  };

  const handleUnlinkClick = (linkId: number, labelKO: string, isActive: boolean) => {
    if (isActive) return; // active면 비활성 버튼 — 클릭 무시
    setUnlinkTarget({ linkId, labelKO });
  };

  const confirmUnlink = () => {
    if (!unlinkTarget) return;
    unlink(unlinkTarget.linkId);
    toast.success('연결을 해제했습니다.');
    setUnlinkTarget(null);
  };

  const confirmApply = () => {
    applyLinks(groupId);
    toast.success('변경사항을 앱에 적용했습니다.');
    setApplyOpen(false);
  };

  const confirmRevert = () => {
    revertLinks(groupId);
    toast.success('미적용 변경을 되돌렸습니다.');
    setRevertOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="감정 이모지 연결 관리"
        breadcrumbItems={[{ label: '기억저장소' }, { label: '감정 이모지 연결 관리' }]}
        actions={
          <button
            onClick={() => setLinkOpen(true)}
            disabled={atMax}
            className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LinkIcon className="w-4 h-4" />이모지 연결
          </button>
        }
      />

      {/* 변경사항 적용 바 */}
      <div className="flex items-center justify-between gap-3 mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="text-sm">
          {pending > 0 ? (
            <span className="font-medium text-amber-700">
              미적용 변경 {pending}건 — 앱에 반영하려면 [변경사항 적용]을 누르세요.
            </span>
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

      {/* 아티스트 선택 + 요약 */}
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
          연결 <span className="font-semibold text-gray-900">{linkedSet.length}</span> / {MAX_LINK_PER_ARTIST}
          <span className="mx-2 text-gray-300">·</span>
          사용 <span className="font-semibold text-emerald-600">{activeCount}</span> / {MAX_ACTIVE_EMOJI}
        </p>
      </div>

      {atMax && (
        <p className="mb-3 text-xs text-amber-600">
          최대 {MAX_LINK_PER_ARTIST}종까지 연결할 수 있습니다. 연결 해제 후 새로 연결하세요.
        </p>
      )}

      {/* 연결 목록 표 */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="text-left font-medium px-4 py-3 w-[90px]">순서</th>
              <th className="text-left font-medium px-4 py-3 w-[80px]">이미지</th>
              <th className="text-left font-medium px-4 py-3">라벨 (한국어 / 영어 / 일본어)</th>
              <th className="text-left font-medium px-4 py-3 w-[120px]">사용여부</th>
              <th className="text-right font-medium px-4 py-3 w-[140px]">관리</th>
            </tr>
          </thead>
          <tbody>
            {linkedSet.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">
                  연결된 감정 이모지가 없습니다. [이모지 연결]로 라이브러리에서 선택하세요.
                </td>
              </tr>
            ) : (
              linkedSet.map((item, idx) => {
                const { link, emoji } = item;
                const canUnlink = !link.active;
                return (
                  <tr key={link.id} className="border-t border-gray-100">
                    {/* 순서 */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="w-6 text-gray-500">{link.order}</span>
                        <button
                          onClick={() => moveLink(link.id, 'up')}
                          disabled={idx === 0}
                          className="w-7 h-7 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="위로"
                        >
                          <ArrowUpIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveLink(link.id, 'down')}
                          disabled={idx === linkedSet.length - 1}
                          className="w-7 h-7 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="아래로"
                        >
                          <ArrowDownIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    {/* 이미지 */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5" title={emoji.imageSrc}>
                        <span className="w-8 h-8 inline-flex items-center justify-center rounded-md bg-indigo-50 border border-indigo-100">
                          <PhotoIcon className="w-4 h-4 text-indigo-400" />
                        </span>
                        <span className="text-[11px] text-gray-400">이미지</span>
                      </span>
                    </td>
                    {/* 라벨 */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{emoji.labelKO}</span>
                      <span className="text-gray-400"> / {emoji.labelEN} / {emoji.labelJA}</span>
                    </td>
                    {/* 사용여부 */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(link.id, link.active)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          link.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${link.active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        {link.active ? '사용' : '미사용'}
                      </button>
                    </td>
                    {/* 관리 */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleUnlinkClick(link.id, emoji.labelKO, link.active)}
                        disabled={!canUnlink}
                        title={!canUnlink ? '사용 중인 이모지는 미사용으로 전환 후 연결 해제할 수 있습니다' : ''}
                        className={`text-sm font-medium ${canUnlink ? 'text-rose-600 hover:text-rose-700' : 'text-gray-300 cursor-not-allowed'}`}
                      >
                        연결 해제
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        표시 순서가 앱의 감정 선택지 노출 순서입니다. 회원은 기억 작성 시 1개를 선택합니다. 규격은 공통 정책([CEB-000] §7.5)을 따릅니다.
      </p>

      {/* 이모지 연결 모달 */}
      <LinkModal
        isOpen={linkOpen}
        onClose={() => setLinkOpen(false)}
        artistGroupId={groupId}
        artistGroupName={groupName}
        currentLinkCount={linkedSet.length}
      />

      {/* 연결 해제 확인 */}
      <ConfirmModal
        isOpen={unlinkTarget !== null}
        onClose={() => setUnlinkTarget(null)}
        onConfirm={confirmUnlink}
        title="연결 해제"
        lines={[
          `'${unlinkTarget?.labelKO ?? ''}' 이모지를 ${groupName} 세트에서 연결 해제할까요?`,
          '라이브러리에는 보존됩니다.',
        ]}
        confirmLabel="연결 해제"
        cancelLabel="취소"
      />

      {/* 변경사항 적용 확인 */}
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

      {/* 되돌리기 확인 */}
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
