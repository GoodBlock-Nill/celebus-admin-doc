'use client';

import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import type { GPHistoryEntry } from '@/mock/gamezone';

// [CEB-BO-GZ-601-MD-DETAIL] v1.5 정합
// - 제목 "변동 상세" (운영 표기, "GP 변동 상세" 아님)
// - 8필드: 변동 ID·일시·닉네임·지갑주소·변동 유형·GP 변동량·변동 후 잔액·비고
// - 닉네임 클릭 → /members/{uid}?tab=basic 같은 탭
// - 운영 BO 실측: 변동 전 잔액·관련 게임·관련 교환·푸터 [닫기] 모두 미노출

export default function GPHistoryDetailModal({
  isOpen,
  onClose,
  entry,
}: {
  isOpen: boolean;
  onClose: () => void;
  entry: GPHistoryEntry | null;
}) {
  const router = useRouter();
  if (!entry) return null;

  const isPositive = entry.amount > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="변동 상세" width="max-w-lg">
      <dl className="grid grid-cols-[110px_1fr] gap-y-3 gap-x-4 text-sm">
        <dt className="text-gray-500">변동 ID</dt>
        <dd className="font-mono text-gray-900">{entry.historyId}</dd>

        <dt className="text-gray-500">일시</dt>
        <dd className="text-gray-900">{entry.occurredAt}</dd>

        <dt className="text-gray-500">닉네임</dt>
        <dd>
          {entry.nickname && entry.uid ? (
            <button
              onClick={() => router.push(`/members/${entry.uid}?tab=basic`)}
              className="font-medium text-indigo-600 hover:underline"
            >
              {entry.nickname}
            </button>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </dd>

        <dt className="text-gray-500">지갑주소</dt>
        <dd className="font-mono text-xs text-gray-700 break-all">{entry.walletAddress}</dd>

        <dt className="text-gray-500">변동 유형</dt>
        <dd>
          {entry.type ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {entry.type}
              {entry.gameType && <span className="ml-1.5 text-gray-400">· {entry.gameType}</span>}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </dd>

        <dt className="text-gray-500">GP 변동량</dt>
        <dd className={`text-base font-bold tabular-nums ${isPositive ? 'text-indigo-600' : 'text-rose-600'}`}>
          {isPositive ? '+' : ''}
          {entry.amount.toLocaleString()} GP
        </dd>

        <dt className="text-gray-500">변동 후 잔액</dt>
        <dd className="text-gray-900 tabular-nums">{entry.balanceAfter.toLocaleString()} GP</dd>

        <dt className="text-gray-500">비고</dt>
        <dd className="text-gray-900">{entry.notes || '-'}</dd>
      </dl>
    </Modal>
  );
}
