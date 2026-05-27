'use client';

import { useMemo, useState } from 'react';
import { ArrowPathIcon, PlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import WalletRegisterModal from '@/components/gamezone/WalletRegisterModal';
import WalletDeleteModal from '@/components/gamezone/WalletDeleteModal';
import { toast } from '@/components/ui/Toast';
import { managedWallets, truncateAddress, type ManagedWallet, type WalletType } from '@/mock/gamezone';

// [CEB-BO-GZ-503] v1.7 정합 — 통계 카드 4종 + 테이블 6컬럼 + 헤더 [지갑 목록
// 새로고침][+ 지갑 등록] + 활성 [삭제] disabled + 모달 2종
export default function WalletsPage() {
  // 로컬 상태로 추가/수정/삭제 시각화 (Toast만, mock 영구 변경은 안 함)
  const [wallets, setWallets] = useState<ManagedWallet[]>(managedWallets);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ManagedWallet | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedWallet | null>(null);

  const stats = useMemo(() => {
    return {
      charge: wallets.filter((w) => w.type === '충전용').length,
      withdraw: wallets.filter((w) => w.type === '출금용').length,
      active: wallets.filter((w) => w.status === '활성').length,
      inactive: wallets.filter((w) => w.status === '비활성').length,
    };
  }, [wallets]);

  const handleRefresh = () => toast.success('지갑 목록을 새로고침했습니다.');

  const handleSubmitRegister = ({
    type,
    address,
    privateKey,
  }: {
    type: WalletType;
    address: string;
    privateKey?: string;
  }) => {
    // 출금용 + PK 입력값이 있으면 마스킹 prefix·suffix 4자로 저장 (운영 BO 실측 형태: `PK: 94d2....97ef`)
    const maskPk = (pk: string) => `PK: ${pk.slice(2, 6)}....${pk.slice(-4)}`;
    if (editTarget) {
      // 수정
      setWallets((prev) =>
        prev.map((w) => {
          if (w.id !== editTarget.id) return w;
          const nextMasked =
            type === '출금용'
              ? privateKey
                ? maskPk(privateKey)
                : w.privateKeyMasked
              : undefined;
          return { ...w, type, address, privateKeyMasked: nextMasked };
        }),
      );
      toast.success('지갑을 수정했습니다.');
      setEditTarget(null);
    } else {
      // 등록
      const nextId = Math.max(...wallets.map((w) => w.id)) + 1;
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      setWallets((prev) => [
        ...prev,
        {
          id: nextId,
          type,
          isPrimary: false,
          address,
          privateKeyMasked: type === '출금용' && privateKey ? maskPk(privateKey) : undefined,
          celbBalance: 0,
          bnbBalance: 0,
          status: '활성',
          registeredAt: `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
        },
      ]);
      toast.success('지갑을 등록했습니다.');
    }
    setRegisterOpen(false);
  };

  const handleToggle = (w: ManagedWallet) => {
    if (w.isPrimary && w.status === '활성') {
      // 운영 BO 실측 정합: 대표 지갑은 비활성화 무반응 가능성
      toast.info('대표 지갑은 비활성화할 수 없습니다. (운영 정책)');
      return;
    }
    const next = w.status === '활성' ? '비활성' : '활성';
    setWallets((prev) => prev.map((x) => (x.id === w.id ? { ...x, status: next } : x)));
    toast.success(`지갑을 ${next === '활성' ? '활성화' : '비활성화'}했습니다.`);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setWallets((prev) => prev.filter((w) => w.id !== deleteTarget.id));
    toast.success('지갑을 삭제했습니다.');
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title="지갑 관리"
          breadcrumbItems={[
            { label: '게임존' },
            { label: 'GP 교환소', href: '/gamezone/exchange' },
            { label: '지갑 관리' },
          ]}
        />
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <ArrowPathIcon className="w-4 h-4" />
            지갑 목록 새로고침
          </button>
          <button
            onClick={() => {
              setEditTarget(null);
              setRegisterOpen(true);
            }}
            className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            <PlusIcon className="w-4 h-4" />
            지갑 등록
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard label="충전용 지갑" value={stats.charge} accent="indigo" />
        <StatCard label="출금용 지갑" value={stats.withdraw} accent="emerald" />
        <StatCard label="활성 지갑" value={stats.active} accent="amber" />
        <StatCard label="비활성 지갑" value={stats.inactive} accent="gray" />
      </div>

      <SimpleTable<ManagedWallet>
        columns={[
          {
            key: 'type',
            label: '유형',
            render: (w) => (
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                    w.type === '충전용' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {w.type}
                </span>
                {w.isPrimary && (
                  <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">
                    대표
                  </span>
                )}
              </div>
            ),
          },
          {
            key: 'address',
            label: '지갑 정보',
            render: (w) => (
              <div>
                <a
                  href={`https://testnet.bscscan.com/address/${w.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-mono text-xs text-blue-600 hover:underline"
                >
                  {truncateAddress(w.address, 10, 8)}
                </a>
                {w.privateKeyMasked && <div className="text-xs text-gray-400 font-mono mt-0.5">{w.privateKeyMasked}</div>}
              </div>
            ),
          },
          {
            key: 'celbBalance',
            label: '잔액',
            align: 'right',
            render: (w) => {
              const lowGas = w.bnbBalance < 0.01;
              return (
                <div className="text-right">
                  <div className="font-medium text-gray-900 tabular-nums">
                    {w.celbBalance.toLocaleString(undefined, { maximumFractionDigits: 8 })} CELB
                  </div>
                  <div className={`text-xs tabular-nums ${lowGas ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                    {lowGas && <ExclamationTriangleIcon className="inline w-3 h-3 mr-0.5" />}
                    {w.bnbBalance.toFixed(8)} BNB
                  </div>
                </div>
              );
            },
          },
          {
            key: 'status',
            label: '상태',
            render: (w) => (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  w.status === '활성' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {w.status}
              </span>
            ),
          },
          { key: 'registeredAt', label: '등록일' },
          {
            key: 'actions',
            label: '액션',
            render: (w) => (
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleToggle(w)}
                  className="px-3 py-1 text-xs text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50"
                >
                  {w.status === '활성' ? '비활성화' : '활성화'}
                </button>
                <button
                  onClick={() => {
                    setEditTarget(w);
                    setRegisterOpen(true);
                  }}
                  className="px-3 py-1 text-xs text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50"
                >
                  수정
                </button>
                <button
                  onClick={() => setDeleteTarget(w)}
                  disabled={w.status === '활성'}
                  className="px-3 py-1 text-xs text-red-600 bg-white border border-red-200 rounded hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:text-gray-400 disabled:border-gray-200"
                >
                  삭제
                </button>
              </div>
            ),
          },
        ]}
        rows={wallets}
        emptyMessage="등록된 지갑이 없습니다. [+ 지갑 등록] 버튼으로 추가해 주세요."
      />

      <WalletRegisterModal
        isOpen={registerOpen}
        onClose={() => {
          setRegisterOpen(false);
          setEditTarget(null);
        }}
        mode={editTarget ? 'edit' : 'create'}
        initial={editTarget ?? undefined}
        onSubmit={handleSubmitRegister}
      />

      <WalletDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        wallet={deleteTarget}
      />
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: 'indigo' | 'emerald' | 'amber' | 'gray' }) {
  const accentColor = {
    indigo: 'text-indigo-700',
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    gray: 'text-gray-700',
  }[accent];
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${accentColor}`}>{value}</div>
    </div>
  );
}
