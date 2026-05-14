// 운영 사이트 /bive/editions, /bive/minting, /bive/benefits mock

export type BiveGrade = 'Event' | 'Ticket' | 'Mix' | 'Pick';

export interface Edition {
  id: number;
  nameKR: string;
  nameEN?: string;
  nameJP?: string;
  registeredBive: number;
  totalMinted: number;
  createdAt: string;
  createdBy: string;
}

export interface BiveToken {
  id: number;
  status: 'Active' | 'Inactive';
  name: string;
  artistGroup: string;
  artist: string;
  grade: BiveGrade;
  gradeNumber: string;
  mintEvent: number;
  mintedCount: number;
  registeredAt: string;
}

export interface MintCampaign {
  id: number;
  status: '활성' | '비활성';
  type: 'EVENT' | 'TICKET' | 'MIX' | 'PICK';
  name: string;
  linkedFeature: string; // "팬퀘스트 보상", "회원가입 보상" 등
  registeredBive: number;
  minted: number;
  createdAt: string;
}

export interface CampaignRewardBive {
  biveName: string;
  artistGroup: string;
  member: string;
  grade: BiveGrade;
  gradeNumber: string;
  weight: number;
  mintedCount: number;
}

export const editions: Edition[] = [
  { id: 2, nameKR: 'CELEBUS', nameEN: 'CELEBUS', nameJP: 'CELEBUS', registeredBive: 1, totalMinted: 439, createdAt: '2026.02.19 14:37', createdBy: 'nill' },
  { id: 1, nameKR: 'V01D', nameEN: 'V01D', nameJP: 'V01D', registeredBive: 23, totalMinted: 2894, createdAt: '2026.02.19 14:22', createdBy: 'nill' },
];

const v01dArtists = ['송유찬', '정지섭', '케빈박', '신노스케', '조주연'];

function makeV01dEditionTokens(): BiveToken[] {
  const grades: { num: string; mintRange: [number, number]; date: string }[] = [
    { num: '004', mintRange: [29, 38], date: '2026.05.04' },
    { num: '003', mintRange: [52, 177], date: '2026.04.27' },
    { num: '002', mintRange: [165, 186], date: '2026.04.09' },
    { num: '001', mintRange: [274, 287], date: '2026.02.19' },
  ];
  let id = 1;
  const tokens: BiveToken[] = [];
  grades.forEach((g) => {
    v01dArtists.forEach((artist, ai) => {
      const range = g.mintRange[1] - g.mintRange[0];
      const minted = g.mintRange[0] + Math.floor((ai * range) / v01dArtists.length);
      tokens.push({
        id: id++,
        status: 'Active',
        name: `${artist} Event-${g.num}`,
        artistGroup: 'V01D',
        artist,
        grade: 'Event',
        gradeNumber: g.num,
        mintEvent: minted,
        mintedCount: minted,
        registeredAt: g.date,
      });
    });
  });
  return tokens;
}

function makeCelebusEditionTokens(): BiveToken[] {
  return [
    { id: 1, status: 'Active', name: 'CELEBUS 1st Welcome ED', artistGroup: 'CELEBUS', artist: 'CELEBUS', grade: 'Event', gradeNumber: '001', mintEvent: 439, mintedCount: 439, registeredAt: '2026.02.19' },
  ];
}

export function getEditionTokens(editionId: number): BiveToken[] {
  if (editionId === 1) return makeV01dEditionTokens();
  if (editionId === 2) return makeCelebusEditionTokens();
  return [];
}

export function getEditionById(id: number): Edition | undefined {
  return editions.find((e) => e.id === id);
}

export const mintCampaigns: MintCampaign[] = [
  { id: 24, status: '활성', type: 'EVENT', name: "V01D 'GUESS JOURNEY #01 SETLIST' 이벤트 참여 인증 🎤", linkedFeature: '팬퀘스트 보상', registeredBive: 1, minted: 22, createdAt: '2026.05.04 15:47' },
  { id: 23, status: '활성', type: 'EVENT', name: "인스타에서 V01D 'journey #01' 응원하기 💜", linkedFeature: '팬퀘스트 보상', registeredBive: 1, minted: 30, createdAt: '2026.05.04 15:46' },
  { id: 22, status: '활성', type: 'EVENT', name: "X에서 V01D 'journey #01' 응원하기 💜", linkedFeature: '팬퀘스트 보상', registeredBive: 1, minted: 33, createdAt: '2026.05.04 15:46' },
  { id: 21, status: '활성', type: 'EVENT', name: "인스타에 V01D 'journey #01' 콘서트 래플 소개하기 🎫", linkedFeature: '팬퀘스트 보상', registeredBive: 1, minted: 32, createdAt: '2026.05.04 15:46' },
  { id: 20, status: '활성', type: 'EVENT', name: "X에 V01D 'journey #01' 콘서트 래플 소개하기 🎫", linkedFeature: '팬퀘스트 보상', registeredBive: 1, minted: 30, createdAt: '2026.05.04 15:45' },
  { id: 19, status: '활성', type: 'EVENT', name: 'V01D TikTok 팔로우 또는 YouTube 구독 인증 📲', linkedFeature: '팬퀘스트 보상', registeredBive: 1, minted: 176, createdAt: '2026.04.27 12:35' },
  { id: 18, status: '활성', type: 'EVENT', name: 'Spotify에서 V01D 팔로우하기 💚', linkedFeature: '팬퀘스트 보상', registeredBive: 1, minted: 126, createdAt: '2026.04.27 12:35' },
  { id: 17, status: '활성', type: 'EVENT', name: 'V01D에게 응원 메시지 남기기 ✉️', linkedFeature: '팬퀘스트 보상', registeredBive: 1, minted: 87, createdAt: '2026.04.27 12:34' },
  { id: 16, status: '활성', type: 'EVENT', name: '나만의 V01D 꾸미기 🎨', linkedFeature: '팬퀘스트 보상', registeredBive: 1, minted: 51, createdAt: '2026.04.27 12:34' },
  { id: 15, status: '활성', type: 'EVENT', name: '친구에게 V01D 소개하기 💬', linkedFeature: '팬퀘스트 보상', registeredBive: 1, minted: 75, createdAt: '2026.04.27 12:33' },
  { id: 14, status: '활성', type: 'EVENT', name: '"LUNA" 스트리밍 인증', linkedFeature: '팬퀘스트 보상', registeredBive: 5, minted: 705, createdAt: '2026.04.09 16:41' },
  { id: 13, status: '활성', type: 'EVENT', name: '"The One" 스트리밍 인증', linkedFeature: '팬퀘스트 보상', registeredBive: 1, minted: 139, createdAt: '2026.04.09 15:08' },
  { id: 12, status: '활성', type: 'EVENT', name: '"ROCKROCK" MV 공유 인증', linkedFeature: '팬퀘스트 보상', registeredBive: 1, minted: 139, createdAt: '2026.04.09 15:05' },
  { id: 11, status: '활성', type: 'EVENT', name: '"Tug of War" 스트리밍 인증', linkedFeature: '팬퀘스트 보상', registeredBive: 1, minted: 144, createdAt: '2026.04.09 15:04' },
  { id: 10, status: '활성', type: 'EVENT', name: '"ROCKROCK" 스트리밍 인증', linkedFeature: '팬퀘스트 보상', registeredBive: 1, minted: 142, createdAt: '2026.04.09 15:04' },
  { id: 9, status: '활성', type: 'EVENT', name: '"Tug of War" MV 공유 인증', linkedFeature: '팬퀘스트 보상', registeredBive: 1, minted: 138, createdAt: '2026.04.09 15:03' },
  { id: 8, status: '활성', type: 'EVENT', name: 'V01D 공식 X 팔로우 퀘스트', linkedFeature: '팬퀘스트 보상', registeredBive: 5, minted: 960, createdAt: '2026.02.24 14:15' },
  { id: 7, status: '활성', type: 'EVENT', name: 'CELEBUS 1st Welcome ED', linkedFeature: '회원가입 보상', registeredBive: 1, minted: 439, createdAt: '2026.02.19 14:41' },
  { id: 6, status: '활성', type: 'EVENT', name: 'V01D 송유찬 인스타 팔로우', linkedFeature: '팬퀘스트 보상', registeredBive: 1, minted: 202, createdAt: '2026.02.19 14:36' },
  { id: 5, status: '활성', type: 'EVENT', name: 'V01D 정자섭 인스타 팔로우', linkedFeature: '팬퀘스트 보상', registeredBive: 1, minted: 201, createdAt: '2026.02.19 14:35' },
];

export function getCampaignById(id: number): MintCampaign | undefined {
  return mintCampaigns.find((c) => c.id === id);
}

export function getCampaignRewards(id: number): CampaignRewardBive[] {
  // For campaign 24: only 송유찬 Event-004 (29 minted, weight 99)
  if (id === 24) {
    return [{ biveName: '송유찬 Event-004', artistGroup: 'V01D', member: '송유찬', grade: 'Event', gradeNumber: '004', weight: 99, mintedCount: 29 }];
  }
  // 14 'LUNA' uses 5 BIVE 보상
  if (id === 14) {
    return v01dArtists.map((m, i) => ({ biveName: `${m} Event-003`, artistGroup: 'V01D', member: m, grade: 'Event', gradeNumber: '003', weight: 20, mintedCount: 100 + i * 30 }));
  }
  if (id === 8) {
    return v01dArtists.map((m, i) => ({ biveName: `${m} Event-001`, artistGroup: 'V01D', member: m, grade: 'Event', gradeNumber: '001', weight: 20, mintedCount: 180 + i * 5 }));
  }
  // Default single reward
  const c = getCampaignById(id);
  if (!c) return [];
  return [{ biveName: '송유찬 Event-001', artistGroup: 'V01D', member: '송유찬', grade: 'Event', gradeNumber: '001', weight: 100, mintedCount: c.minted }];
}

export interface BiveBenefit {
  id: number;
  status: 'Active' | 'Inactive';
  name: string;
  registeredBive: number;
  type: 'BP' | 'TICKET';
  amount: number;
  cycle: 'DAILY' | 'WEEKLY';
  weekday?: string;
  startDate: string;
  endDate: string;
}

export const biveBenefits: BiveBenefit[] = []; // 운영도 비어있음
