/**
 * 운영 사이트 회원 영역 100% 클론용 mock 데이터.
 * - 운영 사이트 /members 의 컬럼·통계와 동일 구조
 * - 운영 데이터(2026.05.06 기준): 전체 578 / 정상 568 / 정지 0 / 탈퇴대기 6 / 탈퇴완료 4
 */

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWAL_PENDING' | 'WITHDRAWAL_COMPLETED';
export type LoginType = 'GOOGLE' | 'APPLE' | 'KAKAO' | 'NAVER' | 'EMAIL';

export interface Member {
  id: string;
  nickname: string;
  email: string;
  phoneCountry: string; // +82, +86 등
  phone: string;
  walletAddress: string | null;
  joinedAt: string; // YYYY.MM.DD HH:mm
  // 상세
  country: string;
  loginType: LoginType;
  lastLoginAt: string;
  accountStatus: AccountStatus;
  didIssued: boolean;
  setApprovalGranted: boolean;
  bio: string;
}

export const STATUS_LABEL: Record<AccountStatus, { label: string; bg: string; text: string }> = {
  ACTIVE: { label: '정상', bg: 'bg-green-100', text: 'text-green-700' },
  SUSPENDED: { label: '정지', bg: 'bg-red-100', text: 'text-red-700' },
  WITHDRAWAL_PENDING: { label: '탈퇴대기', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  WITHDRAWAL_COMPLETED: { label: '탈퇴완료', bg: 'bg-gray-100', text: 'text-gray-600' },
};

export const LOGIN_LABEL: Record<LoginType, string> = {
  GOOGLE: 'Google',
  APPLE: 'Apple',
  KAKAO: 'Kakao',
  NAVER: 'Naver',
  EMAIL: '이메일',
};

// Seeded RNG
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

const REF = new Date('2026-05-06T13:03:00+09:00').getTime();
function fmt(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 운영 회원 일부 + 가짜 데이터로 578명 생성
const NICKNAMES = [
  'in.mycosmos', 'qqqaas', 'luna_jiyun_lee', 'dhyem', 'jaea306122',
  'manju', 'sally410504', 'sohyun0105', '', 'suu.b1n',
  'mimi', 'jjeom5jjang', 'effieee02', 'xxxx', 'rdy0602',
  'lena', 'xbdjeui', 'c.s.k', 'yoon', 'hello17',
  'ttee', 'celebus', 'joonk85', 'teddy2', 'mice',
];

const COUNTRIES: Array<[string, string, string]> = [
  ['+82', 'KR', 'Korea, Republic of South Korea'],
  ['+82', 'KR', 'Korea, Republic of South Korea'],
  ['+82', 'KR', 'Korea, Republic of South Korea'],
  ['+82', 'KR', 'Korea, Republic of South Korea'],
  ['+86', 'CN', 'China'],
  ['+81', 'JP', 'Japan'],
  ['+1', 'US', 'United States'],
];

const LOGIN_TYPES: LoginType[] = ['GOOGLE', 'APPLE', 'KAKAO', 'NAVER', 'EMAIL'];

export const members: Member[] = (() => {
  const list: Member[] = [];
  const total = 578;

  for (let i = 0; i < total; i++) {
    const r = rng(1000 + i);
    const idNum = total - i; // ttee가 마지막(=가장 오래된, id 작은 값)
    const nickname = NICKNAMES[i] ?? (r() > 0.05 ? `user_${idNum}` : '');
    const [code, , country] = COUNTRIES[Math.floor(r() * COUNTRIES.length)];
    const phone = String(Math.floor(r() * 9_000_000_000) + 1_000_000_000);
    const walletAddress = r() > 0.08
      ? `0x${Array.from({ length: 40 }, () => Math.floor(r() * 16).toString(16)).join('')}`
      : null;
    // 가입일은 첫 행이 가장 최근 (운영 정렬: 가입일 최신순)
    const joinedTs = REF - i * (5 * 60 * 1000 + Math.floor(r() * 30 * 60 * 1000));
    const lastLoginTs = joinedTs + Math.floor(r() * 30 * 86400000);

    // 상태 분포: 568 정상 / 6 탈퇴대기 / 4 탈퇴완료 / 0 정지 (운영 데이터)
    let accountStatus: AccountStatus = 'ACTIVE';
    if (i === 15 || i === 100 || i === 200 || i === 300 || i === 400 || i === 500) accountStatus = 'WITHDRAWAL_PENDING';
    if (i === 50 || i === 250 || i === 450 || i === 550) accountStatus = 'WITHDRAWAL_COMPLETED';

    list.push({
      id: String(idNum),
      nickname,
      email: nickname ? `${nickname.replace(/\W+/g, '')}@good-block.com` : '-',
      phoneCountry: code,
      phone,
      walletAddress,
      joinedAt: fmt(joinedTs),
      country,
      loginType: LOGIN_TYPES[Math.floor(r() * LOGIN_TYPES.length)],
      lastLoginAt: fmt(Math.min(lastLoginTs, REF)),
      accountStatus,
      didIssued: r() > 0.55,
      setApprovalGranted: r() > 0.5,
      bio: '',
    });
  }
  return list;
})();

export function getMemberStats() {
  return {
    total: members.length,
    active: members.filter((m) => m.accountStatus === 'ACTIVE').length,
    suspended: members.filter((m) => m.accountStatus === 'SUSPENDED').length,
    withdrawalPending: members.filter((m) => m.accountStatus === 'WITHDRAWAL_PENDING').length,
    withdrawalCompleted: members.filter((m) => m.accountStatus === 'WITHDRAWAL_COMPLETED').length,
  };
}

export function getMemberById(id: string): Member | undefined {
  return members.find((m) => m.id === id);
}

// 운영 사이트의 BIVE 데이터 (in.mycosmos 회원이 1개 보유)
export interface BiveOwned {
  id: string;
  memberId: string;
  editionFull: string; // "CELEBUS / CELEBUS / CELEBUS" 형식
  artistGroupFull: string;
  artistFull: string;
  biveName: string; // "CELEBUS Event-001"
  grade: 'Event' | 'Ticket' | 'Mix' | 'Pick';
  gradeNumber: string; // "001"
  tokenIdShort: string; // "#3337"
  tokenIdFull: string; // - (운영에서는 - 표시)
  mintedAt: string; // YYYY.MM.DD
  mintEvent: string; // "CELEBUS 1st Welcome ED"
  holderNickname: string;
  holderWalletShort: string; // "0x8023E9F2...3689Becc"
  imageSrc: string;
  // 기능상태
  canSend: boolean;
  canMix: boolean;
  canPick: boolean;
}

export const biveOwned: BiveOwned[] = [
  {
    id: 'bv-1',
    memberId: '578', // in.mycosmos = id 578 (가장 최근 가입자, NICKNAMES[0])
    editionFull: 'CELEBUS / CELEBUS / CELEBUS',
    artistGroupFull: 'CELEBUS / CELEBUS / CELEBUS',
    artistFull: 'CELEBUS / CELEBUS / CELEBUS',
    biveName: 'CELEBUS Event-001',
    grade: 'Event',
    gradeNumber: '001',
    tokenIdShort: '#3337',
    tokenIdFull: '-',
    mintedAt: '2026.05.06',
    mintEvent: 'CELEBUS 1st Welcome ED',
    holderNickname: 'in.mycosmos',
    holderWalletShort: '0x8023E9F2...3689Becc',
    imageSrc: 'https://assets.celebus.xyz/celebus/bive/6.png',
    canSend: false,
    canMix: false,
    canPick: false,
  },
];

export function getBivesByMember(memberId: string): BiveOwned[] {
  return biveOwned.filter((b) => b.memberId === memberId);
}

// 참여내역 — 4서브탭 (투표·Quest·Raffle·부스팅)
export interface VoteEntry {
  id: string;
  memberId: string;
  status: 'Active' | 'Closed';
  projectName: string; // "언더라이트 (UNDER:LIGHT)"
  voteType: string; // "MAIN"
  title: string; // "1차 메인 투표"
  totalVotes: number;
  lastEnteredAt: string;
}

// ttee 회원에 운영 데이터 매칭: 1건
export const voteEntries: VoteEntry[] = [
  {
    id: 've-1',
    memberId: '1', // ttee
    status: 'Active',
    projectName: '언더라이트 (UNDER:LIGHT)',
    voteType: 'MAIN',
    title: '1차 메인 투표',
    totalVotes: 4,
    lastEnteredAt: '2026.03.25 13:37',
  },
];

export function getVotesByMember(memberId: string): VoteEntry[] {
  return voteEntries.filter((v) => v.memberId === memberId);
}

// 게임존 GP 변동 — ttee 회원 9건 (운영 동일)
export type GPChangeType = 'CHARGE' | 'WITHDRAW' | 'NONE';

export interface GPChange {
  id: string;
  memberId: string;
  occurredAt: string; // YYYY.MM.DD HH:mm
  type: GPChangeType;
  amount: number; // +/- GP
  balanceAfter: number;
  notes: string;
}

export const gpChanges: GPChange[] = [
  { id: 'gp-1', memberId: '1', occurredAt: '2026.04.29 19:14', type: 'NONE', amount: 5, balanceAfter: 15, notes: 'GP 출석체크' },
  { id: 'gp-2', memberId: '1', occurredAt: '2026.04.28 14:08', type: 'NONE', amount: 5, balanceAfter: 10, notes: 'GP 출석체크' },
  { id: 'gp-3', memberId: '1', occurredAt: '2026.04.27 13:15', type: 'NONE', amount: 5, balanceAfter: 5, notes: 'GP 출석체크' },
  { id: 'gp-4', memberId: '1', occurredAt: '2026.04.24 13:37', type: 'NONE', amount: -5, balanceAfter: 0, notes: '응모권 구매' },
  { id: 'gp-5', memberId: '1', occurredAt: '2026.04.24 13:07', type: 'NONE', amount: 5, balanceAfter: 5, notes: 'GP 출석체크' },
  { id: 'gp-6', memberId: '1', occurredAt: '2026.03.25 16:39', type: 'WITHDRAW', amount: -5, balanceAfter: 0, notes: 'GP 보내기' },
  { id: 'gp-7', memberId: '1', occurredAt: '2026.03.25 16:38', type: 'CHARGE', amount: 5, balanceAfter: 5, notes: 'GP 가져오기' },
  { id: 'gp-8', memberId: '1', occurredAt: '2026.03.25 16:38', type: 'WITHDRAW', amount: -5, balanceAfter: 0, notes: 'GP 보내기' },
  { id: 'gp-9', memberId: '1', occurredAt: '2026.03.25 16:37', type: 'CHARGE', amount: 5, balanceAfter: 5, notes: 'GP 가져오기' },
];

export function getGPChangesByMember(memberId: string): GPChange[] {
  return gpChanges.filter((g) => g.memberId === memberId);
}

export function getGPSummary(memberId: string) {
  const all = getGPChangesByMember(memberId);
  const balance = all.length > 0 ? all[0].balanceAfter : 0;
  const earned = all.filter((c) => c.amount > 0).reduce((s, c) => s + c.amount, 0);
  const used = all.filter((c) => c.amount < 0).reduce((s, c) => s + Math.abs(c.amount), 0);
  return { balance, earned, used };
}
