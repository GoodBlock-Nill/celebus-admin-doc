'use client';

import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import { truncateAddress, type ExchangeEntry } from '@/mock/gamezone';

// [CEB-BO-GZ-501-MD-DETAIL] v1.3 정합
// - 모달 제목 "교환 상세"
// - 11필드 + 실패 사유(실패 시)
// - 모달 방향 Badge: "GP로 충전" / "GP로 출금" (부모 테이블 "GP 충전/출금"과 미세 차이)
// - 상태 Badge: "성공"(초록) / "실패"(빨강)
// - Txid·지갑주소 → testnet.bscscan.com 새 탭 (target=_blank)
// - 닉네임 클릭 → /members/{uid}?tab=basic 같은 탭
// - 닫기: [X] / Esc만 (백드롭 미동작은 Modal 컴포넌트 정책)

export default function ExchangeDetailModal({
  isOpen,
  onClose,
  entry,
}: {
  isOpen: boolean;
  onClose: () => void;
  entry: ExchangeEntry | null;
}) {
  const router = useRouter();
  if (!entry) return null;

  const dirBadge = entry.direction === 'GP 충전'
    ? { label: 'GP로 충전', bg: 'bg-indigo-50', text: 'text-indigo-700' }
    : { label: 'GP로 출금', bg: 'bg-gray-100', text: 'text-gray-700' };

  const statusBadge = entry.status === '성공'
    ? { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
    : { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="교환 상세" width="max-w-lg">
      <dl className="grid grid-cols-[100px_1fr] gap-y-3 gap-x-4 text-sm">
        <dt className="text-gray-500">Txid</dt>
        <dd>
          <a
            href={`https://testnet.bscscan.com/tx/${entry.txid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-mono text-xs text-blue-600 hover:underline"
          >
            {entry.txid}
          </a>
        </dd>

        <dt className="text-gray-500">교환일시</dt>
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
        <dd>
          <a
            href={`https://testnet.bscscan.com/address/${entry.walletAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-mono text-xs text-blue-600 hover:underline"
          >
            {entry.walletAddress}
          </a>
        </dd>

        <dt className="text-gray-500">교환 방향</dt>
        <dd>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${dirBadge.bg} ${dirBadge.text}`}>
            {dirBadge.label}
          </span>
        </dd>

        <dt className="text-gray-500">GP 수량</dt>
        <dd className="text-gray-900">{entry.gpAmount.toLocaleString()} GP</dd>

        <dt className="text-gray-500">CELB 수량</dt>
        <dd className="text-gray-900">{entry.celbAmount.toLocaleString()} CELB</dd>

        <dt className="text-gray-500">적용 비율</dt>
        <dd className="text-gray-900">{entry.ratioText}</dd>

        <dt className="text-gray-500">교환 전 GP 잔액</dt>
        <dd className="text-gray-900">{entry.gpBalanceBefore.toLocaleString()} GP</dd>

        <dt className="text-gray-500">교환 후 GP 잔액</dt>
        <dd className="text-gray-900">{entry.gpBalanceAfter.toLocaleString()} GP</dd>

        <dt className="text-gray-500">상태</dt>
        <dd>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
            {entry.status}
          </span>
        </dd>

        {entry.failReason && (
          <>
            <dt className="text-gray-500">실패 사유</dt>
            <dd className="text-red-700">{entry.failReason}</dd>
          </>
        )}
      </dl>

      {/* 운영 BO 정합: 별도 [닫기] 푸터 없음. 우상단 [X] 또는 Esc만 */}
    </Modal>
  );
}

export { truncateAddress };
