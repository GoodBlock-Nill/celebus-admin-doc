// 운영 사이트 /artists/groups, /artists/members 100% mock

export type ArtistStatus = 'Active' | 'Inactive';

export interface ArtistGroup {
  id: number;
  status: ArtistStatus;
  name: string;
  memberCount: number;
  description: string;
  updatedAt: string;
  // 상세
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  logoSrc?: string;
  mainImageSrc?: string;
  nameKO?: string;
  nameEN?: string;
  nameJP?: string;
  descriptionKO?: string;
  descriptionEN?: string;
  descriptionJP?: string;
  sns?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
    homepage?: string;
  };
}

export interface ArtistMember {
  id: number;
  status: ArtistStatus;
  name: string;
  groupCount: number;
  birthday: string;
  gender: '여자' | '남자';
  updatedAt: string;
  // 상세
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  agency?: string;
  heightCm?: number;
  weightKg?: number;
  zodiac?: string;
  profileImageSrc?: string;
  nameKO?: string;
  nameEN?: string;
  nameJP?: string;
  introKO?: string;
  introEN?: string;
  introJP?: string;
  greetingKO?: string;
  greetingEN?: string;
  greetingJP?: string;
  hobbyKO?: string;
  hobbyEN?: string;
  hobbyJP?: string;
  mottoKO?: string;
  mottoEN?: string;
  mottoJP?: string;
  groups?: { id: number; name: string; position: string; isMain: boolean }[];
}

export interface GroupMemberRelation {
  groupId: number;
  memberId: number;
  position: string;
  registeredAt: string;
}

export const artistGroups: ArtistGroup[] = [
  {
    id: 1,
    status: 'Active',
    name: '언더라이트 (UNDER:LIGHT)',
    memberCount: 50,
    description:
      '지하 무대의 빛나는 원석들이 모였다. 한국과 일본, 두 나라의 지하아이돌 50명이 하나의 무대에서 꿈을 건다. 작은 라이브하우스에서 갈고닦은 실력, 거리 위에서 키운 개성, 누구도 주목하지 않던 그 시간들이 이제 세상에 드러날 차례다.',
    updatedAt: '2026.02.11 11:33',
  },
  {
    id: 2,
    status: 'Active',
    name: 'V01D',
    memberCount: 5,
    description:
      'V01D는 공허(Void)라는 이름 위에 사운드로 존재를 새기는 남성 밴드입니다. 그 공허에 글을 새긴다, 설렘으로, 빛으로, 불로, 그리고 이별로. 이 앨범의 곡들은 그 글 사이로 흘러나온 소리들입니다.',
    updatedAt: '2026.04.01 09:53',
    createdBy: '-',
    createdAt: '2026.02.03 16:42',
    updatedBy: '-',
    nameKO: 'V01D',
    nameEN: 'V01D',
    nameJP: 'V01D',
    descriptionKO:
      'V01D는 공허(Void)라는 이름 위에 사운드로 존재를 새기는 남성 밴드입니다. 그 공허에 글을 새긴다, 설렘으로, 빛으로, 불로, 그리고 이별로. 이 앨범의 곡들은 그 글 사이로 흘러나온 소리들입니다. 완전하지 않기에 더 진실한 감정, 아름다움은 언제나 불완전한 속에서 탄생합니다. 전 멤버 180cm 이상의 압도적인 비주얼과 밴드 본질에 충실한 연주력, 음악·비주얼·퍼포먼스가 하나의 완성된 서사로 작동하는 팀을 지향합니다.',
    descriptionEN:
      "V01D is a male band that carves existence through sound upon the name Void. Carving words into that void with excitement, light, fire, and farewell - the album's tracks are sounds flowing between these words. Emotions more truthful for being incomplete, beauty always born from imperfection.",
    descriptionJP:
      'V01Dは空虚(Void)という名の上にサウンドで存在を刻むバンドです。その空虚に言葉を刻みます。ときめき、光、炎、そして別れで。',
    sns: {},
  },
  {
    id: 3,
    status: 'Active',
    name: 'CELEBUS',
    memberCount: 1,
    description: '독점 투표, NFT 수집, 콘서트 경험으로 최고의 팬 커뮤니티에 참여하세요',
    updatedAt: '2026.04.01 09:51',
  },
  {
    id: 4,
    status: 'Active',
    name: 'MADEIN',
    memberCount: 6,
    description: 'MADEIN(메이딘)은 2024년 데뷔 이후, 감각적인 사운드와 깊이 있는 메시지로 주목받고 있는 신예 아티스트입니다.',
    updatedAt: '2026.02.11 11:45',
  },
  {
    id: 5,
    status: 'Active',
    name: 'iKON',
    memberCount: 6,
    description: 'iKON은 YG 엔터테인먼트 출신의 143엔터테인먼트 소속으로 대한민국 6인조 남성 아이돌 음악 그룹이다. 멤버는 김진환, 송윤형, BOBBY, 김동혁, 구준회, 정찬우로 구성되어 있다',
    updatedAt: '2026.02.11 11:45',
  },
];

// 69 멤버 — 운영 데이터 일부 + 자동 생성
const SAMPLE_NAMES = [
  ['오카다 호노카', '여자', '2003.10.10'],
  ['후지타 유메', '여자', '2004.04.01'],
  ['마에다 시오리', '여자', '2001.07.19'],
  ['이시카와 루나', '여자', '2002.10.15'],
  ['하시모토 코하루', '여자', '2006.03.21'],
  ['이케다 유우', '여자', '2003.06.30'],
  ['모리타 카나데', '여자', '2004.08.08'],
  ['시미즈 아야카', '여자', '2005.01.03'],
  ['하야시 미사키', '여자', '2002.04.10'],
  ['키무라 유키노', '여자', '2003.12.20'],
];

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export const artistMembers: ArtistMember[] = (() => {
  const list: ArtistMember[] = [];
  const r = rng(2000);
  for (let i = 0; i < 69; i++) {
    if (i < SAMPLE_NAMES.length) {
      const [name, gender, birthday] = SAMPLE_NAMES[i];
      list.push({
        id: i + 1,
        status: 'Active',
        name,
        groupCount: 1,
        birthday,
        gender: gender as '여자' | '남자',
        updatedAt: `2026.02.10 ${String(13 - Math.floor(i / 3)).padStart(2, '0')}:${String(4 - (i % 5)).padStart(2, '0')}`.replace(/-\d+/, '00'),
      });
    } else {
      const isInactive = i === 68;
      list.push({
        id: i + 1,
        status: isInactive ? 'Inactive' : 'Active',
        name: `멤버${String(i + 1).padStart(3, '0')}`,
        groupCount: r() > 0.85 ? 2 : 1,
        birthday: `200${Math.floor(r() * 6)}.0${Math.floor(r() * 9) + 1}.${String(Math.floor(r() * 28) + 1).padStart(2, '0')}`,
        gender: r() > 0.5 ? '여자' : '남자',
        updatedAt: `2026.02.${String(Math.floor(r() * 9) + 1).padStart(2, '0')} ${String(Math.floor(r() * 12) + 9).padStart(2, '0')}:${String(Math.floor(r() * 60)).padStart(2, '0')}`,
      });
    }
  }
  return list;
})();

export const artistStats = {
  groups: { total: 5, active: 5, inactive: 0 },
  members: { total: 69, active: 68, inactive: 1 },
};

// V01D 그룹 멤버 (운영 데이터)
export const v01dMembers: { id: number; name: string; position: string; birthday: string; gender: '여자' | '남자'; registeredAt: string }[] = [
  { id: 1001, name: '조주연', position: '메인 보컬', birthday: '2000.05.08', gender: '남자', registeredAt: '2026.02.03 17:17' },
  { id: 1002, name: '신노스케', position: '베이스', birthday: '2005.01.01', gender: '남자', registeredAt: '2026.02.03 17:17' },
  { id: 1003, name: '케빈박', position: '키보드', birthday: '2001.01.01', gender: '남자', registeredAt: '2026.02.03 17:17' },
  { id: 1004, name: '정지섭', position: '기타', birthday: '2001.01.01', gender: '남자', registeredAt: '2026.02.03 17:17' },
  { id: 1005, name: '송유찬', position: '드럼', birthday: '1995.01.01', gender: '남자', registeredAt: '2026.02.03 17:17' },
];

export function getGroupById(id: number): ArtistGroup | undefined {
  return artistGroups.find((g) => g.id === id);
}

export function getGroupMembers(groupId: number) {
  // V01D = id 2 (운영) 근데 운영에서 V01D 클릭 시 id=4 였음. mock도 id=2로 매핑
  return groupId === 2 || groupId === 4 ? v01dMembers : [];
}

export function getMemberById(id: number): ArtistMember | undefined {
  const m = artistMembers.find((m) => m.id === id);
  if (!m) return undefined;
  // 첫 번째 멤버(오카다 호노카) 상세 데이터
  if (id === 1) {
    return {
      ...m,
      createdBy: 'nill',
      createdAt: '2026.02.10',
      updatedBy: 'nill',
      agency: '소속사 없음',
      heightCm: 161,
      weightKg: 46,
      zodiac: '천칭자리',
      nameKO: '오카다 호노카',
      nameEN: 'Okada Honoka',
      nameJP: '岡田穂花',
      introKO: '센다이 출신으로 지역 축제에서 공연하며 시작했어요. 따뜻한 미소가 저의 트레이드마크입니다.',
      introEN: "I'm from Sendai and started by performing at local festivals. My warm smile is my trademark.",
      introJP: '仙台出身で地域のお祭りで公演して始めました。温かい笑顔が私のトレードマークです。',
      greetingKO: '이삭처럼 풍요로운 아이돌, 오카다 호노카입니다!',
      greetingEN: "An idol as abundant as a grain of rice, I'm Okada Honoka!",
      greetingJP: '穂のように豊かなアイドル、岡田穂花です！',
      hobbyKO: '정원 가꾸기, 우쿨렐레',
      hobbyEN: 'Gardening, ukulele',
      hobbyJP: 'ガーデニング、ウクレレ',
      mottoKO: '작은 씨앗도 큰 꽃이 된다',
      mottoEN: 'Even a small seed becomes a big flower',
      mottoJP: '小さな種も大きな花になる',
      groups: [{ id: 1, name: '언더라이트 (UNDER:LIGHT)', position: '멤버', isMain: true }],
    };
  }
  return m;
}
