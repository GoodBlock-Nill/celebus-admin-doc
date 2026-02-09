'use client';

import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import type { Exchange } from '@/lib/types';
import { formatDateTime, formatGP, formatCELB, formatNumber } from '@/lib/utils';

interface ExchangeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  exchange: Exchange | null;
}

function CopyButton({ text }: { text: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
      title="복사"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    </button>
  );
}

function HashField({ label, value, explorerUrl }: { label: string; value: string; explorerUrl: string }) {
  return (
    <div className="flex items-start py-2 border-b border-gray-100">
      <span className="text-sm text-gray-500 w-[120px] shrink-0">{label}</span>
      <div className="flex-1 flex items-start gap-1">
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline break-all"
        >
          {value}
        </a>
        <CopyButton text={value} />
      </div>
    </div>
  );
}

export default function ExchangeDetailModal({ isOpen, onClose, exchange }: ExchangeDetailModalProps) {
  if (!exchange) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="교환 상세" width="max-w-2xl">
      <div className="space-y-3">
        <HashField
          label="Txid"
          value={exchange.txid}
          explorerUrl={`https://bscscan.com/tx/${exchange.txid}`}
        />

        <div className="flex items-start py-2 border-b border-gray-100">
          <span className="text-sm text-gray-500 w-[120px] shrink-0">교환일시</span>
          <span className="text-sm text-gray-900">{formatDateTime(exchange.datetime)}</span>
        </div>

        <div className="flex items-start py-2 border-b border-gray-100">
          <span className="text-sm text-gray-500 w-[120px] shrink-0">닉네임</span>
          <span className="text-sm text-blue-600 cursor-pointer hover:underline">{exchange.nickname.toLowerCase()}</span>
        </div>

        <HashField
          label="지갑주소"
          value={exchange.walletAddress}
          explorerUrl={`https://bscscan.com/address/${exchange.walletAddress}`}
        />

        {[
          { label: '교환 방향', value: <Badge variant="exchangeDir" value={exchange.direction} /> },
          { label: 'GP 수량', value: formatGP(exchange.gpAmount) },
          { label: 'CELB 수량', value: formatCELB(exchange.celbAmount) },
          { label: '적용 비율', value: '1 GP = 1.0 CELB' },
          { label: '교환 전 GP 잔액', value: formatGP(exchange.gpBefore) },
          { label: '교환 후 GP 잔액', value: formatGP(exchange.gpAfter) },
          { label: '상태', value: <Badge variant="exchangeStatus" value={exchange.status} /> },
          ...(exchange.failureReason ? [{ label: '실패 사유', value: <span className="text-red-600">{exchange.failureReason}</span> }] : []),
        ].map((row, i) => (
          <div key={i} className="flex items-start py-2 border-b border-gray-100 last:border-0">
            <span className="text-sm text-gray-500 w-[120px] shrink-0">{row.label}</span>
            <span className="text-sm text-gray-900">{row.value}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
