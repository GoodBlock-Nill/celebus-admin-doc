'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/modals/ConfirmModal';
import { useUIStore } from '@/stores/useUIStore';
import { mockOperationWallets } from '@/mock/settings';
import { formatDateTime, formatCELB, truncateHash } from '@/lib/utils';
import type { OperationWallet } from '@/lib/types';

export default function WalletManagementPage() {
  const { addToast, activeModal, openModal, closeModal } = useUIStore();
  const [wallets, setWallets] = useState<OperationWallet[]>(mockOperationWallets);
  const [editingWallet, setEditingWallet] = useState<OperationWallet | null>(null);
  const [deletingWallet, setDeletingWallet] = useState<OperationWallet | null>(null);

  // Form states
  const [walletType, setWalletType] = useState<'CHARGE' | 'WITHDRAW'>('CHARGE');
  const [walletAddress, setWalletAddress] = useState('');
  const [walletPrivateKey, setWalletPrivateKey] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleOpenCreateForm = () => {
    setEditingWallet(null);
    setWalletType('CHARGE');
    setWalletAddress('');
    setWalletPrivateKey('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (wallet: OperationWallet) => {
    setEditingWallet(wallet);
    setWalletType(wallet.type);
    setWalletAddress(wallet.address);
    setWalletPrivateKey('');
    setIsFormOpen(true);
  };

  const handleSaveWallet = () => {
    if (!walletAddress.trim()) {
      addToast('error', '지갑 주소를 입력하세요.');
      return;
    }

    if (!editingWallet && !walletPrivateKey.trim()) {
      addToast('error', 'Private Key를 입력하세요.');
      return;
    }

    if (editingWallet) {
      // Update existing wallet
      setWallets(wallets.map(w =>
        w.id === editingWallet.id
          ? {
              ...w,
              type: walletType,
              address: walletAddress,
              ...(walletPrivateKey ? {
                privateKey: walletPrivateKey.substring(0, 4) + '...' + walletPrivateKey.substring(walletPrivateKey.length - 4),
              } : {}),
              ...(walletType === 'WITHDRAW' && !w.bnbBalance ? { bnbBalance: 0 } : {}),
              ...(walletType === 'CHARGE' ? { bnbBalance: undefined } : {}),
              isPrimary: walletType === editingWallet.type ? w.isPrimary : false,
              updatedAt: new Date().toISOString(),
            }
          : w
      ));
      addToast('success', '지갑이 수정되었습니다.');
    } else {
      // Create new wallet
      const newWallet: OperationWallet = {
        id: `wallet-${Date.now()}`,
        type: walletType,
        address: walletAddress,
        privateKey: walletPrivateKey.substring(0, 4) + '...' + walletPrivateKey.substring(walletPrivateKey.length - 4),
        ...(walletType === 'WITHDRAW' ? { bnbBalance: 0 } : {}),
        balance: 0,
        isActive: true,
        isPrimary: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setWallets([...wallets, newWallet]);
      addToast('success', '지갑이 등록되었습니다.');
    }

    setIsFormOpen(false);
    setEditingWallet(null);
    setWalletAddress('');
    setWalletPrivateKey('');
  };

  const handleDeleteWallet = () => {
    if (!deletingWallet) return;
    if (deletingWallet.isPrimary) {
      addToast('error', '대표 지갑은 삭제할 수 없습니다. 먼저 다른 지갑을 대표로 지정해주세요.');
      setDeletingWallet(null);
      return;
    }
    setWallets(wallets.filter(w => w.id !== deletingWallet.id));
    addToast('success', '지갑이 삭제되었습니다.');
    setDeletingWallet(null);
  };

  const handleSetPrimary = (wallet: OperationWallet) => {
    setWallets(wallets.map(w => ({
      ...w,
      isPrimary: w.type === wallet.type ? w.id === wallet.id : w.isPrimary,
      updatedAt: w.type === wallet.type && w.id === wallet.id ? new Date().toISOString() : w.updatedAt,
    })));
    addToast('success', `${wallet.type === 'CHARGE' ? '충전용' : '출금용'} 대표 지갑이 변경되었습니다.`);
  };

  const handleToggleActive = (wallet: OperationWallet) => {
    setWallets(wallets.map(w =>
      w.id === wallet.id
        ? { ...w, isActive: !w.isActive, updatedAt: new Date().toISOString() }
        : w
    ));
    addToast('success', wallet.isActive ? '지갑이 비활성화되었습니다.' : '지갑이 활성화되었습니다.');
  };

  const handleRefreshBalance = () => {
    addToast('success', '잔액이 갱신되었습니다.');
  };

  return (
    <div>
      <PageHeader
        title="지갑 관리"
        breadcrumbItems={[
          { label: '게임존', href: '/game-zone' },
          { label: 'GP 교환소', href: '/game-zone/exchange' },
          { label: '지갑 관리' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshBalance}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              잔액 새로고침
            </button>
            <button
              onClick={handleOpenCreateForm}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              + 지갑 등록
            </button>
          </div>
        }
      />

      <div className="bg-white border border-gray-200 rounded-lg">
        <DataTable<OperationWallet & Record<string, unknown>>
          columns={[
            {
              key: 'type',
              label: '유형',
              width: '160px',
              render: (item: OperationWallet) => (
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="custom"
                    value={item.type}
                    customBg={item.type === 'CHARGE' ? 'bg-blue-100' : 'bg-orange-100'}
                    customText={item.type === 'CHARGE' ? 'text-blue-600' : 'text-orange-600'}
                    customLabel={item.type === 'CHARGE' ? '충전용' : '출금용'}
                  />
                  {item.isPrimary && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-700">
                      대표
                    </span>
                  )}
                </div>
              ),
            },
            {
              key: 'walletInfo',
              label: '지갑 정보',
              render: (item: OperationWallet) => (
                <div className="flex flex-col gap-0.5">
                  <a
                    href={`https://bscscan.com/address/${item.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="font-mono text-sm text-blue-600 hover:underline"
                  >
                    {truncateHash(item.address, 12, 8)}
                  </a>
                  {item.privateKey && (
                    <span className="font-mono text-xs text-gray-400">
                      PK: {item.privateKey}
                    </span>
                  )}
                </div>
              ),
            },
            {
              key: 'balanceInfo',
              label: '잔액',
              align: 'right',
              width: '220px',
              render: (item: OperationWallet) => {
                const bnb = item.bnbBalance ?? 0;
                const isWithdraw = item.type === 'WITHDRAW';
                const bnbWarning = isWithdraw && bnb < 0.01;
                return (
                  <div className="flex flex-col gap-0.5 items-end">
                    <span className="font-semibold">{formatCELB(item.balance, 8)}</span>
                    <span className={`text-xs ${bnbWarning ? 'text-red-600' : 'text-gray-500'}`}>
                      {bnbWarning && '⚠ '}
                      {bnb.toFixed(6)} BNB
                    </span>
                  </div>
                );
              },
            },
            {
              key: 'isActive',
              label: '상태',
              align: 'center',
              width: '100px',
              render: (item: OperationWallet) => (
                <Badge
                  variant="custom"
                  value={item.isActive ? 'active' : 'inactive'}
                  customBg={item.isActive ? 'bg-green-100' : 'bg-gray-100'}
                  customText={item.isActive ? 'text-green-600' : 'text-gray-500'}
                  customLabel={item.isActive ? '활성' : '비활성'}
                />
              ),
            },
            {
              key: 'createdAt',
              label: '등록일',
              width: '160px',
              render: (item: OperationWallet) => formatDateTime(item.createdAt),
            },
            {
              key: 'actions',
              label: '',
              width: '300px',
              render: (item: OperationWallet) => (
                <div className="flex items-center gap-2 justify-end">
                  {!item.isPrimary && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSetPrimary(item); }}
                      className="px-3 py-1.5 text-xs text-yellow-700 border border-yellow-300 rounded hover:bg-yellow-50"
                    >
                      대표 지정
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleActive(item); }}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50"
                  >
                    {item.isActive ? '비활성화' : '활성화'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpenEditForm(item); }}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50"
                  >
                    수정
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingWallet(item); }}
                    className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={item.isPrimary}
                  >
                    삭제
                  </button>
                </div>
              ),
            },
          ]}
          data={wallets as (OperationWallet & Record<string, unknown>)[]}
          emptyMessage="등록된 지갑이 없습니다."
        />
      </div>

      {/* Wallet Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingWallet ? '지갑 수정' : '지갑 등록'}
        width="max-w-md"
        footer={
          <>
            <button
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleSaveWallet}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              {editingWallet ? '수정' : '등록'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">지갑 유형</label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setWalletType('CHARGE')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  walletType === 'CHARGE' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                충전용
              </button>
              <button
                type="button"
                onClick={() => setWalletType('WITHDRAW')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  walletType === 'WITHDRAW' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                출금용
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              지갑 주소 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">블록체인 지갑 주소를 입력하세요.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Private Key {!editingWallet && <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              value={walletPrivateKey}
              onChange={(e) => setWalletPrivateKey(e.target.value)}
              placeholder="Private Key를 입력하세요"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              {editingWallet
                ? '변경이 필요한 경우에만 입력하세요.'
                : '토큰 전송 트랜잭션 서명에 필요합니다. 서버에 암호화하여 저장됩니다.'}
            </p>
          </div>
          {walletType === 'WITHDRAW' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-700">
                ⚠ 출금용 지갑은 가스비(BNB) 잔고가 있어야 출금이 가능합니다.
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deletingWallet}
        onClose={() => setDeletingWallet(null)}
        onConfirm={handleDeleteWallet}
        title="지갑 삭제 확인"
        message={`${deletingWallet?.type === 'CHARGE' ? '충전용' : '출금용'} 지갑을 삭제하시겠습니까?`}
        warning="삭제된 지갑은 복구할 수 없습니다."
        confirmText="삭제"
        confirmVariant="danger"
      />
    </div>
  );
}
