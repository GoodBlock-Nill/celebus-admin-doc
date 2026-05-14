// 운영 게임존 mock

export const gameZoneStats = {
  // 전체 현황
  activeGames: 0,
  resultPending: 0,
  todayCharge: 0, // GP
  todayWithdraw: 0, // GP
  // 게임 관리
  pm: { active: 0, resultPending: 0, todayParticipants: 0 },
  st: { active: 0, ready: 0, todayParticipants: 0 },
  // 운영 요약
  ranking: { top10Public: false, top1Nickname: '-', top1GP: 0 },
  exchange: { todayCharge: 0, todayWithdraw: 0 },
  gpHistory: { todayCount: 17 },
};

export const games: Array<{
  id: number;
  title: string;
  status: string;
  participants: number;
  totalPrize: number;
  period: string;
  createdAt: string;
  admin: string;
}> = [];

// GP 변동 내역 — 운영 화면 실제 데이터 (2026.05.06)
export interface GPHistoryEntry {
  id: number;
  occurredAt: string; // YYYY.MM.DD HH:mm:ss
  nickname: string;
  type: '' | 'GP 충전' | 'GP 출금';
  gameType: '' | 'PM' | 'ST';
  amount: number; // +/- GP
  balanceAfter: number;
  notes: string;
}

const SEED_NICKNAMES = [
  'nanananna1', 'sunday1', 'zziong', 'from_june', 'stay.yourself.skz',
  'ygfam', 'yewon1640', 'yoon', 'skdud', 'hyeonny',
  'mozzi1118', 'haeul22', '1311', 'su_suy', 'hhhh',
  'sssssouffleeeee', 'sxlvxr', 'manju', 'sally410504', 'yebin',
];

export const gpHistory: GPHistoryEntry[] = (() => {
  const list: GPHistoryEntry[] = [];
  const startTs = new Date('2026-05-06T15:25:32+09:00').getTime();
  for (let i = 0; i < SEED_NICKNAMES.length; i++) {
    const ts = new Date(startTs - i * 60 * 60 * 1000 - i * 7 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${ts.getFullYear()}.${pad(ts.getMonth() + 1)}.${pad(ts.getDate())} ${pad(ts.getHours())}:${pad(ts.getMinutes())}:${pad(ts.getSeconds())}`;
    list.push({
      id: i + 1,
      occurredAt: dateStr,
      nickname: SEED_NICKNAMES[i],
      type: '',
      gameType: '',
      amount: 5,
      balanceAfter: (i % 8) * 5 + 5,
      notes: 'GP 출석체크',
    });
  }
  return list;
})();
