'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import type { ManagedWallet, WalletType } from '@/mock/gamezone';

// [CEB-BO-GZ-503-MD-REGISTER] v1.6 정합
// - 등록·수정 공용 모달. 제목/CTA 분기 ("지갑 등록"+[등록] / "지갑 수정"+[수정])
// - 지갑 유형 Dropdown 선택에 따라 본문 동적 분기
//   · 충전용: 2필드 (유형 + 주소)
//   · 출금용: 3필드 (유형 + 주소 + Private Key) + 본문 하단 BNB 가스비 안내 박스
// - PK 검증: 출금용 등록 시 필수 (0x + 64자리 hex). 수정 모드에서는 빈 값 허용 — 빈 값이면 기존 PK 유지

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initial?: ManagedWallet;
  onSubmit: (data: { type: WalletType; address: string; privateKey?: string }) => void;
}

const PK_PATTERN = /^0x[a-fA-F0-9]{64}$/;

export default function WalletRegisterModal({ isOpen, onClose, mode, initial, onSubmit }: Props) {
  const [type, setType] = useState<WalletType>('충전용');
  const [address, setAddress] = useState('');
  const [privateKey, setPrivateKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      setType(initial?.type ?? '충전용');
      setAddress(initial?.address ?? '');
      // PK는 보안상 prefill하지 않음 (운영 BO도 마스킹만 노출, 평문 미반환 가정)
      setPrivateKey('');
    }
  }, [isOpen, initial]);

  const isEdit = mode === 'edit';
  const title = isEdit ? '지갑 수정' : '지갑 등록';
  const cta = isEdit ? '수정' : '등록';
  const isWithdrawal = type === '출금용';

  const handleTypeChange = (next: WalletType) => {
    setType(next);
    if (next === '충전용') setPrivateKey('');
  };

  const addressValid = address.trim().length > 0;
  // 출금용 등록 모드 → PK 필수. 수정 모드 → 빈 값 허용 (빈 값이면 기존 PK 유지)
  const pkValid = !isWithdrawal
    ? true
    : isEdit
      ? privateKey === '' || PK_PATTERN.test(privateKey)
      : PK_PATTERN.test(privateKey);
  const canSubmit = addressValid && pkValid;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      type,
      address: address.trim(),
      privateKey: isWithdrawal && privateKey ? privateKey : undefined,
    });
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
            disabled={!canSubmit}
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
            onChange={(e) => handleTypeChange(e.target.value as WalletType)}
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
        {isWithdrawal && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Private Key <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder={isEdit ? '교체 시에만 입력 (빈 값이면 기존 유지)' : 'Private Key를 입력하세요'}
                className="h-10 w-full px-3 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                토큰 전송 트랜잭션 서명에 필요합니다. 서버에 암호화하여 저장됩니다.
              </p>
              <p className="text-xs text-gray-500">형식: 0x + 64자리 hex</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-xs text-amber-700">
                출금용 지갑은 가스비(BNB) 잔고가 있어야 출금이 가능합니다.
              </p>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
