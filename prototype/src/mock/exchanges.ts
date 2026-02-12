import type { Exchange, ExchangeDirection, ExchangeStatus } from '@/lib/types';

const NICKNAMES = [
  'starlight', 'pink_blink', 'carat_love', 'dive_in', 'engine_on',
  'wishful', 'my_once', 'kepler_fan', 'love_guys', 'islander',
  'forever_one', 'unit_fan', 'golden_child', 'neverland', 'atinys',
];

function randomHex(length: number): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

const WALLETS = Array.from({ length: 15 }, () => `0x${randomHex(40)}`);

export const mockExchanges: Exchange[] = Array.from({ length: 60 }, (_, i) => {
  const direction: ExchangeDirection = Math.random() > 0.5 ? 'CHARGE' : 'WITHDRAW';
  const rate = 1;
  const gpAmount = [100, 500, 1000, 5000, 10000][Math.floor(Math.random() * 5)];
  const celbAmount = gpAmount;
  const gpBefore = Math.floor(Math.random() * 50000) + 1000;
  const isFailed = Math.random() > 0.9;

  return {
    txid: `0x${randomHex(64)}`,
    datetime: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
    nickname: NICKNAMES[i % NICKNAMES.length] + String(Math.floor(Math.random() * 100)),
    walletAddress: WALLETS[i % WALLETS.length],
    direction,
    gpAmount,
    celbAmount,
    rate,
    gpBefore,
    gpAfter: direction === 'CHARGE' ? gpBefore + gpAmount : gpBefore - gpAmount,
    status: (isFailed ? 'FAILED' : 'SUCCESS') as ExchangeStatus,
    failureReason: isFailed ? '일일 교환 한도 초과' : null,
  };
})
// 기본 정렬: 최근내역순 (교환일시 내림차순)
.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
