'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import type { ManagedWallet, WalletType } from '@/mock/gamezone';

// [CEB-BO-GZ-503-MD-REGISTER] v1.4 정합
// - 등록·수정 공용 모달. 제목/CTA 분기 ("지갑 등록"+[등록] / "지갑 수정"+[수정])
// - 운영 실측: Private Key 필드 미노출, 출금용 BNB 안내 박스 없음
// - 필드: 지갑 유형 Dropdown + 지갑 주소 Input

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initial?: ManagedWallet;
  onSubmit: (data: { type: WalletType; address: string }) => void;
}

export default function WalletRegisterModal({ isOpen, onClose, mode, initial, onSubmit }: Props) {
  const [type, setType] = useState<WalletType>('충전용');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (isOpen) {
      setType(initial?.type ?? '충전용');
      setAddress(initial?.address ?? '');
    }
  }, [isOpen, initial]);

  const isEdit = mode === 'edit';
  const title = isEdit ? '지갑 수정' : '지갑 등록';
  const cta = isEdit ? '수정' : '등록';

  const handleSubmit = () => {
    if (!address.trim()) return;
    onSubmit({ type, address: address.trim() });
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
            disabled={!address.trim()}
            className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cta}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">지갑 유형</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as WalletType)}
            className="h-10 w-full px-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="충전용">충전용</option>
            <option value="출금용">출금용</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            지갑 주소 <span className="text-red-500">*</span>
          </label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x..."
            className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">블록체인 지갑 주소를 입력하세요.</p>
        </div>
      </div>
    </Modal>
  );
}
