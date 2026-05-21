// 운영 사이트 /bive/editions, /bive/minting, /bive/benefits mock
// v2 명세 [CEB-BO-004] v1.4 + 운영 BO 실제 데이터 기반 (V01D 5명 + 5그룹 + 4종 캠페인)

export type BiveGrade = 'Event' | 'Normal' | 'Special' | 'Wicked' | 'Next' | 'Final';
export type BiveStatus = 'Draft' | 'Active' | 'Inactive';
export type CampaignStatus = '초안' | '활성' | '중지' | '종료';
export type CampaignType = 'EVENT' | 'TICKET' | 'MIX' | 'PICK';
export type LinkedFeature = '회원가입 보상' | '출석체크 보상' | '래플 보상' | '팬퀘스트 보상';
export type BenefitStatus = '초안' | '대기' | '활성' | '중지' | '종료';
export type BenefitType = 'BP' | 'TICKET';
export type BenefitCycle = 'DAILY' | 'WEEKLY' | 'ONCE';

// ---------- 아티스트 그룹·아티스트 마스터 ----------

export interface ArtistGroup {
  id: number;
  name: string;
  members: string[];
}

export const artistGroups: ArtistGroup[] = [
  { id: 1, name: '언더라이트', members: ['리아', '소율', '하나'] },
  { id: 2, name: 'V01D', members: ['송유찬', '정지섭', '케빈박', '신노스케', '조주연'] },
  { id: 3, name: 'CELEBUS', members: ['CELEBUS'] },
  { id: 4, name: 'MADEIN', members: ['윤하', '서윤', '도아', '나래'] },
  { id: 5, name: 'iKON', members: ['바비', '준회', '동혁', '진환', '구준'] },
];

export function getArtistsByGroup(groupName: string): string[] {
  return artistGroups.find((g) => g.name === groupName)?.members ?? [];
}

export const BIVE_GRADES: BiveGrade[] = ['Event', 'Normal', 'Special', 'Wicked', 'Next', 'Final'];

// ---------- 에디션 ----------

export interface Edition {
  id: number;
  nameKR: string;
  nameEN: string;
  nameJP: string;
  registeredBive: number;
  totalMinted: number;
  createdAt: string;
  createdBy: string;
}

export const editions: Edition[] = [
  { id: 5, nameKR: 'iKON 데뷔 ED', nameEN: 'iKON Debut ED', nameJP: 'iKON デビュー ED', registeredBive: 0, totalMinted: 0, createdAt: '2026.05.18 10:14', createdBy: 'nill' },
  { id: 4, nameKR: 'MADEIN 시즌 1', nameEN: 'MADEIN Season 1', nameJP: 'MADEIN シーズン1', registeredBive: 2, totalMinted: 18, createdAt: '2026.04.30 11:22', createdBy: 'nill' },
  { id: 3, nameKR: '언더라이트 첫 ED', nameEN: 'Underlight 1st ED', nameJP: 'アンダーライト 初 ED', registeredBive: 3, totalMinted: 47, createdAt: '2026.03.12 09:05', createdBy: 'nill' },
  { id: 2, nameKR: 'CELEBUS', nameEN: 'CELEBUS', nameJP: 'CELEBUS', registeredBive: 1, totalMinted: 439, createdAt: '2026.02.19 14:37', createdBy: 'nill' },
  { id: 1, nameKR: 'V01D', nameEN: 'V01D', nameJP: 'V01D', registeredBive: 23, totalMinted: 2894, createdAt: '2026.02.19 14:22', createdBy: 'nill' },
];

export function getEditionById(id: number): Edition | undefined {
  return editions.find((e) => e.id === id);
}

// ---------- BIVE 토큰 ----------

export interface BiveToken {
  id: number;
  editionId: number;
  status: BiveStatus;
  name: string;
  artistGroup: string;
  artist: string;
  grade: BiveGrade;
  gradeNumber: string;
  mintEvent: number; // 연결된 민팅 이벤트 수
  mintedCount: number;
  registeredAt: string;
  description?: string;
  mediaUrl?: string;
  toggles: { send: boolean; mix: boolean; pick: boolean };
}

function makeV01dEditionTokens(): BiveToken[] {
  const v01dArtists = artistGroups.find((g) => g.name === 'V01D')!.members;
  // 운영 BO 정합: 모든 BIVE Event 등급, 등급번호 001~004 (5명 × 4 = 20건) + 등급 005 일부 (3건 = 23 총합)
  const grades: { num: string; mintRange: [number, number]; date: string }[] = [
    { num: '004', mintRange: [55, 66], date: '2026.05.04' },
    { num: '003', mintRange: [58, 216], date: '2026.04.27' },
    { num: '002', mintRange: [183, 216], date: '2026.04.09' },
    { num: '001', mintRange: [311, 327], date: '2026.02.19' },
  ];
  let id = 1;
  const tokens: BiveToken[] = [];
  grades.forEach((g) => {
    v01dArtists.forEach((artist, ai) => {
      const range = g.mintRange[1] - g.mintRange[0];
      const minted = g.mintRange[0] + Math.floor((ai * range) / v01dArtists.length);
      tokens.push({
        id: id++,
        editionId: 1,
        status: 'Active',
        name: `${artist} Event-${g.num}`,
        artistGroup: 'V01D',
        artist,
        grade: 'Event',
        gradeNumber: g.num,
        mintEvent: 1,
        mintedCount: minted,
        registeredAt: g.date,
        toggles: { send: true, mix: true, pick: true },
      });
    });
  });
  // 추가 3건 (운영 등록된 BIVE=23 충족용 — Event 등급 005)
  tokens.push(
    { id: id++, editionId: 1, status: 'Active', name: '송유찬 Event-005', artistGroup: 'V01D', artist: '송유찬', grade: 'Event', gradeNumber: '005', mintEvent: 1, mintedCount: 12, registeredAt: '2026.05.10', toggles: { send: true, mix: true, pick: true } },
    { id: id++, editionId: 1, status: 'Active', name: '정지섭 Event-005', artistGroup: 'V01D', artist: '정지섭', grade: 'Event', gradeNumber: '005', mintEvent: 1, mintedCount: 8, registeredAt: '2026.05.10', toggles: { send: true, mix: true, pick: true } },
    { id: id++, editionId: 1, status: 'Active', name: '케빈박 Event-005', artistGroup: 'V01D', artist: '케빈박', grade: 'Event', gradeNumber: '005', mintEvent: 1, mintedCount: 9, registeredAt: '2026.05.10', toggles: { send: true, mix: true, pick: true } },
  );
  return tokens;
}

function makeCelebusEditionTokens(): BiveToken[] {
  return [
    { id: 1, editionId: 2, status: 'Active', name: 'CELEBUS Event-001', artistGroup: 'CELEBUS', artist: 'CELEBUS', grade: 'Event', gradeNumber: '001', mintEvent: 1, mintedCount: 439, registeredAt: '2026.02.19', toggles: { send: true, mix: true, pick: true }, description: 'CELEBUS 1st Welcome Edition' },
  ];
}

function makeUnderlightEditionTokens(): BiveToken[] {
  return [
    { id: 1, editionId: 3, status: 'Active', name: '리아 Normal-001', artistGroup: '언더라이트', artist: '리아', grade: 'Normal', gradeNumber: '001', mintEvent: 1, mintedCount: 18, registeredAt: '2026.03.12', toggles: { send: true, mix: true, pick: true } },
    { id: 2, editionId: 3, status: 'Active', name: '소율 Normal-001', artistGroup: '언더라이트', artist: '소율', grade: 'Normal', gradeNumber: '001', mintEvent: 1, mintedCount: 16, registeredAt: '2026.03.12', toggles: { send: true, mix: true, pick: true } },
    { id: 3, editionId: 3, status: 'Active', name: '하나 Normal-001', artistGroup: '언더라이트', artist: '하나', grade: 'Normal', gradeNumber: '001', mintEvent: 1, mintedCount: 13, registeredAt: '2026.03.12', toggles: { send: true, mix: true, pick: true } },
  ];
}

function makeMadeinEditionTokens(): BiveToken[] {
  return [
    { id: 1, editionId: 4, status: 'Active', name: '윤하 Normal-001', artistGroup: 'MADEIN', artist: '윤하', grade: 'Normal', gradeNumber: '001', mintEvent: 0, mintedCount: 10, registeredAt: '2026.04.30', toggles: { send: true, mix: true, pick: true } },
    { id: 2, editionId: 4, status: 'Draft', name: '서윤 Normal-001', artistGroup: 'MADEIN', artist: '서윤', grade: 'Normal', gradeNumber: '001', mintEvent: 0, mintedCount: 8, registeredAt: '2026.04.30', toggles: { send: true, mix: true, pick: true } },
  ];
}

export function getEditionTokens(editionId: number): BiveToken[] {
  if (editionId === 1) return makeV01dEditionTokens();
  if (editionId === 2) return makeCelebusEditionTokens();
  if (editionId === 3) return makeUnderlightEditionTokens();
  if (editionId === 4) return makeMadeinEditionTokens();
  return [];
}

export function getBiveTokenById(editionId: number, biveId: number): BiveToken | undefined {
  return getEditionTokens(editionId).find((t) => t.id === biveId);
}

// ---------- 민팅 이벤트 (Event/Ticket/Mix/Pick) ----------

export interface MintCampaign {
  id: number;
  status: CampaignStatus;
  type: CampaignType;
  name: string;
  linkedFeature: LinkedFeature | string;
  registeredBive: number;
  minted: number;
  createdAt: string;
  updatedAt?: string;
}

export const mintCampaigns: MintCampaign[] = [
  // Event 탭 — 4종 연결 기능 분포
  { id: 24, status: '활성', type: 'EVENT', name: "V01D 'GUESS JOURNEY #01 SETLIST' 이벤트 참여 인증", linkedFeature: '팬퀘스트 보상', registeredBive: 1, minted: 22, createdAt: '2026.05.04 15:47' },
  { id: 23, status: '활성', type: 'EVENT', name: "인스타에서 V01D 'journey #01' 응원하기", linkedFeature: '팬퀘스트 보상', registeredBive: 1, minted: 30, createdAt: '2026.05.04 15:46' },
  { id: 22, status: '활성', type: 'EVENT', name: "X에서 V01D 'journey #01' 응원하기", linkedFeature: '팬퀘스트 보상', registeredBive: 1, minted: 33, createdAt: '2026.05.04 15:46' },
  { id: 21, status: '활성', type: 'EVENT', name: 'V01D 7일 출석체크 보상', linkedFeature: '출석체크 보상', registeredBive: 2, minted: 312, createdAt: '2026.04.27 12:35' },
  { id: 20, status: '활성', type: 'EVENT', name: 'V01D journey 래플 응모자 보상', linkedFeature: '래플 보상', registeredBive: 1, minted: 88, createdAt: '2026.04.20 09:11' },
  { id: 14, status: '활성', type: 'EVENT', name: '"LUNA" 스트리밍 인증', linkedFeature: '팬퀘스트 보상', registeredBive: 5, minted: 705, createdAt: '2026.04.09 16:41' },
  { id: 8, status: '활성', type: 'EVENT', name: 'V01D 공식 X 팔로우 퀘스트', linkedFeature: '팬퀘스트 보상', registeredBive: 5, minted: 960, createdAt: '2026.02.24 14:15' },
  { id: 7, status: '활성', type: 'EVENT', name: 'CELEBUS 1st Welcome ED', linkedFeature: '회원가입 보상', registeredBive: 1, minted: 439, createdAt: '2026.02.19 14:41' },
  { id: 6, status: '초안', type: 'EVENT', name: 'iKON 데뷔 출석체크 보상', linkedFeature: '출석체크 보상', registeredBive: 0, minted: 0, createdAt: '2026.05.18 10:20' },
  { id: 5, status: '중지', type: 'EVENT', name: '구버전 회원가입 보상 (중단)', linkedFeature: '회원가입 보상', registeredBive: 1, minted: 1240, createdAt: '2025.12.01 09:00' },
  // Ticket 탭 — 예시 2건
  { id: 50, status: '활성', type: 'TICKET', name: "V01D 'journey #01' 콘서트 티켓 검증", linkedFeature: '티켓 검증', registeredBive: 1, minted: 412, createdAt: '2026.04.15 10:00' },
  { id: 51, status: '초안', type: 'TICKET', name: 'MADEIN 데뷔 쇼케이스 티켓 검증', linkedFeature: '티켓 검증', registeredBive: 0, minted: 0, createdAt: '2026.05.10 14:30' },
];

export function getCampaignById(id: number): MintCampaign | undefined {
  return mintCampaigns.find((c) => c.id === id);
}

export interface CampaignRewardBive {
  biveId: number;
  editionId: number;
  biveName: string;
  artistGroup: string;
  artist: string;
  grade: BiveGrade;
  gradeNumber: string;
  weight: number;
  mintedCount: number;
}

export function getCampaignRewards(id: number): CampaignRewardBive[] {
  const v01d = artistGroups.find((g) => g.name === 'V01D')!.members;
  if (id === 24) {
    return [{ biveId: 1, editionId: 1, biveName: '송유찬 Event-004', artistGroup: 'V01D', artist: '송유찬', grade: 'Event', gradeNumber: '004', weight: 99, mintedCount: 29 }];
  }
  if (id === 21) {
    return [
      { biveId: 5, editionId: 1, biveName: '송유찬 Event-001', artistGroup: 'V01D', artist: '송유찬', grade: 'Event', gradeNumber: '001', weight: 60, mintedCount: 188 },
      { biveId: 6, editionId: 1, biveName: '정지섭 Event-001', artistGroup: 'V01D', artist: '정지섭', grade: 'Event', gradeNumber: '001', weight: 40, mintedCount: 124 },
    ];
  }
  if (id === 14) {
    return v01d.map((m, i) => ({ biveId: i + 1, editionId: 1, biveName: `${m} Event-003`, artistGroup: 'V01D', artist: m, grade: 'Event' as const, gradeNumber: '003', weight: 20, mintedCount: 100 + i * 30 }));
  }
  if (id === 8) {
    return v01d.map((m, i) => ({ biveId: i + 1, editionId: 1, biveName: `${m} Event-001`, artistGroup: 'V01D', artist: m, grade: 'Event' as const, gradeNumber: '001', weight: 20, mintedCount: 180 + i * 5 }));
  }
  if (id === 7) {
    return [{ biveId: 1, editionId: 2, biveName: 'CELEBUS Event-001', artistGroup: 'CELEBUS', artist: 'CELEBUS', grade: 'Event', gradeNumber: '001', weight: 100, mintedCount: 439 }];
  }
  if (id === 50) {
    return [{ biveId: 5, editionId: 1, biveName: '송유찬 Event-001', artistGroup: 'V01D', artist: '송유찬', grade: 'Event', gradeNumber: '001', weight: 100, mintedCount: 412 }];
  }
  const c = getCampaignById(id);
  if (!c) return [];
  return [{ biveId: 1, editionId: 1, biveName: '송유찬 Event-001', artistGroup: 'V01D', artist: '송유찬', grade: 'Event', gradeNumber: '001', weight: 100, mintedCount: c.minted }];
}

// 민팅 이력 (회원 단위 발행 추적, §6 §10 BIVE 상세 4탭 §민팅이력)
export interface MintHistoryRecord {
  tokenId: string;
  nickname: string;
  walletAddress: string;
  mintedAt: string;
}

export function getMintHistory(campaignId: number, limit: number = 30): MintHistoryRecord[] {
  const c = getCampaignById(campaignId);
  if (!c) return [];
  // 회원 닉네임 규칙: 영문 소문자 + 숫자 + _ + . 만 사용 (mock/members.ts NICKNAMES 표준)
  const nicknames = ['in.mycosmos', 'luna_jiyun_lee', 'manju', 'sohyun0105', 'suu.b1n', 'jjeom5jjang', 'celebus', 'joonk85', 'mooncat', 'lunaria'];
  const count = Math.min(limit, c.minted);
  return Array.from({ length: count }).map((_, i) => ({
    tokenId: `0x${(campaignId * 1000 + i).toString(16).padStart(8, '0')}`,
    nickname: nicknames[i % nicknames.length],
    walletAddress: `0x${(0xa1b2 + i * 17).toString(16)}...${(0x4c5d + i).toString(16)}`,
    mintedAt: `2026.04.${String(((i % 28) + 1)).padStart(2, '0')} ${String(9 + (i % 12)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
  }));
}

// ---------- 혜택 (Boost Point / Raffle Ticket) ----------

export interface BiveBenefit {
  id: number;
  status: BenefitStatus;
  name: string;
  type: BenefitType;
  amount: number;
  cycle: BenefitCycle;
  weekday?: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  registeredBive: number;
  createdAt: string;
}

export const biveBenefits: BiveBenefit[] = [
  { id: 3, status: '활성', name: 'V01D 일일 BP 적립', type: 'BP', amount: 50, cycle: 'DAILY', startDate: '2026.05.01', startTime: '00:00', endDate: '2026.12.31', endTime: '23:59', registeredBive: 5, createdAt: '2026.04.28 10:00' },
  { id: 2, status: '대기', name: '주말 V01D Normal 보너스 BP', type: 'BP', amount: 100, cycle: 'WEEKLY', weekday: '토', startDate: '2026.06.01', startTime: '00:00', endDate: '2026.12.31', endTime: '23:59', registeredBive: 5, createdAt: '2026.05.10 11:20' },
  { id: 1, status: '초안', name: 'CELEBUS 1st Welcome 응모권', type: 'TICKET', amount: 1, cycle: 'ONCE', startDate: '2026.06.01', startTime: '00:00', endDate: '2026.12.31', endTime: '23:59', registeredBive: 1, createdAt: '2026.05.18 09:30' },
];

export function getBenefitById(id: number): BiveBenefit | undefined {
  return biveBenefits.find((b) => b.id === id);
}

export interface BenefitBive {
  biveId: number;
  editionId: number;
  biveName: string;
  artistGroup: string;
  artist: string;
  grade: BiveGrade;
  gradeNumber: string;
}

export function getBenefitBives(id: number): BenefitBive[] {
  const v01d = artistGroups.find((g) => g.name === 'V01D')!.members;
  if (id === 3 || id === 2) {
    return v01d.map((m, i) => ({ biveId: i + 5, editionId: 1, biveName: `${m} Event-001`, artistGroup: 'V01D', artist: m, grade: 'Event' as const, gradeNumber: '001' }));
  }
  if (id === 1) {
    return [{ biveId: 1, editionId: 2, biveName: 'CELEBUS Event-001', artistGroup: 'CELEBUS', artist: 'CELEBUS', grade: 'Event', gradeNumber: '001' }];
  }
  return [];
}
