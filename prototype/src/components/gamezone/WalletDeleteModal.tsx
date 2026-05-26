'use client';

import Modal from '@/components/ui/Modal';
import { truncateAddress, type ManagedWallet } from '@/mock/gamezone';

// [CEB-BO-GZ-503-MD-DELETE] v1.1 정합 — 비활성 지갑만 호출. 활성은 [삭제] disabled
export default function WalletDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  wallet,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  wallet: ManagedWallet | null;
}) {
  if (!wallet) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="지갑을 삭제하시겠습니까?"
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
            onClick={onConfirm}
            className="h-10 px-5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            삭제하기
          </button>
        </>
      }
    >
      <p className="text-sm text-red-700 font-medium mb-3">삭제된 지갑은 복구할 수 없습니다.</p>
      <dl className="grid grid-cols-[80px_1fr] gap-y-2 gap-x-3 text-sm bg-gray-50 rounded-lg p-3">
        <dt className="text-gray-500">지갑 유형</dt>
        <dd className="text-gray-900">{wallet.type}</dd>
        <dt className="text-gray-500">지갑 주소</dt>
        <dd className="text-gray-900 font-mono text-xs break-all">{truncateAddress(wallet.address, 10, 8)}</dd>
      </dl>
    </Modal>
  );
}
