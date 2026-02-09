import type { RankingSettings, ExchangeSettings, OperationWallet } from '@/lib/types';

export const defaultRankingSettings: RankingSettings = {
  top10Public: true,
  rankingBasis: 'ACCUMULATED_GP',
  updateFrequency: 'REALTIME',
  minParticipationCount: 1,
};

export const defaultExchangeSettings: ExchangeSettings = {
  gpToCelbRate: 1.0,
  celbToGpRate: 1.0,
  chargeMinCelb: 10,
  chargeMaxCelb: 100000,
  chargeDailyLimitCelb: 500000,
  chargeDailyLimitCount: 10,
  withdrawMinGP: 100,
  withdrawMaxGP: 1000000,
  withdrawDailyLimitGP: 5000000,
  withdrawDailyLimitCount: 5,
  chargeEnabled: true,
  withdrawEnabled: true,
};

export const mockOperationWallets: OperationWallet[] = [
  {
    id: 'wallet-001',
    type: 'CHARGE',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    balance: 1500000,
    isActive: true,
    isPrimary: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
  {
    id: 'wallet-003',
    type: 'CHARGE',
    address: '0x2222333344445555666677778888999900001111',
    balance: 800000,
    isActive: true,
    isPrimary: false,
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-02-10T11:00:00Z',
  },
  {
    id: 'wallet-004',
    type: 'CHARGE',
    address: '0x33334444555566667777888899990000aaaabbbb',
    balance: 50000,
    isActive: false,
    isPrimary: false,
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-05T09:00:00Z',
  },
  {
    id: 'wallet-002',
    type: 'WITHDRAW',
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    balance: 2500000,
    isActive: true,
    isPrimary: true,
    createdAt: '2024-01-16T09:00:00Z',
    updatedAt: '2024-01-21T11:00:00Z',
  },
  {
    id: 'wallet-005',
    type: 'WITHDRAW',
    address: '0xbbbbccccddddeeeeffffaaaa1111222233334444',
    balance: 1200000,
    isActive: true,
    isPrimary: false,
    createdAt: '2024-02-15T10:00:00Z',
    updatedAt: '2024-02-20T14:00:00Z',
  },
];

// 대시보드 통계용 mock 데이터
export const mockGPStats = {
  totalActiveUserGP: 45678900, // 전체 활성 유저 보유 GP
  totalInactiveUserGP: 1234500, // 탈퇴 유저 GP
  chargeWalletBalance: 1500000, // 충전 지갑 CELB 잔액
  withdrawWalletBalance: 2500000, // 출금 지갑 CELB 잔액
};
