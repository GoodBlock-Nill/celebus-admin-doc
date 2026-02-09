'use client';

import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import GPDisplay from '@/components/ui/GPDisplay';
import type { GPChange } from '@/lib/types';
import { formatDateTime, formatNumber } from '@/lib/utils';

interface GPChangeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  change: GPChange | null;
}

export default function GPChangeDetailModal({ isOpen, onClose, change }: GPChangeDetailModalProps) {
  if (!change) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="변동 상세" width="max-w-lg">
      <div className="space-y-3">
        {[
          { label: '변동 ID', content: <span>{change.id}</span> },
          { label: '일시', content: <span>{formatDateTime(change.datetime)}</span> },
          { label: '닉네임', content: <span className="text-blue-600 cursor-pointer hover:underline">{change.nickname.toLowerCase()}</span> },
          { label: '지갑주소', content: <span className="font-mono text-xs break-all">{change.walletAddress}</span> },
          { label: '변동 유형', content: <Badge variant="gpType" value={change.type} /> },
          { label: 'GP 변동량', content: <GPDisplay amount={change.amount} showSign /> },
          { label: '변동 후 잔액', content: <span>{formatNumber(change.balanceAfter)} GP</span> },
          ...(change.relatedGameTitle ? [{ label: '관련 게임', content: <span className="text-blue-600 cursor-pointer hover:underline">{change.relatedGameTitle}</span> }] : []),
          ...(change.relatedExchangeId ? [{ label: '관련 교환', content: change.txid
            ? <a href={`https://bscscan.com/tx/${change.txid}`} target="_blank" rel="noopener noreferrer"
                className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline break-all">{change.txid}</a>
            : <span className="text-gray-400">-</span> }] : []),
          { label: '비고', content: <span>{change.notes}</span> },
        ].map((row, i) => (
          <div key={i} className="flex items-start py-2 border-b border-gray-100 last:border-0">
            <span className="text-sm text-gray-500 w-[120px] shrink-0">{row.label}</span>
            <span className="text-sm text-gray-900">{row.content}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
