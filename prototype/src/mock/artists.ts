// 운영 사이트 /artists/groups, /artists/members 100% mock

export type ArtistStatus = 'Active' | 'Inactive';

export interface ArtistGroup {
  id: number;
  status: ArtistStatus;
  name: string;
  memberCount: number;
  followerCount?: number; // 앱 팔로워 수
  description: string;
  updatedAt: string;
  exploreExposed?: boolean; // 앱 아티스트 탐색 노출 여부 (기본 켬). 그룹 리스트 [탐색 노출] 컬럼에서 제어
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
    followerCount: 128430,
    exploreExposed: true,
    description:
      '지하 무대의 빛나는 원석들이 모였다. 한국과 일본, 두 나라의 지하아이돌 50명이 하나의 무대에서 꿈을 건다. 작은 라이브하우스에서 갈고닦은 실력, 거리 위에서 키운 개성, 누구도 주목하지 않던 그 시간들이 이제 세상에 드러날 차례다.',
    updatedAt: '2026.02.11 11:33',
  },
  {
    id: 2,
    status: 'Active',
    name: 'V01D',
    memberCount: 5,
    followerCount: 8210,
    exploreExposed: true,
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
    followerCount: 342910,
    exploreExposed: true,
    description: '독점 투표, NFT 수집, 콘서트 경험으로 최고의 팬 커뮤니티에 참여하세요',
    updatedAt: '2026.04.01 09:51',
  },
  {
    id: 4,
    status: 'Active',
    name: 'MADEIN',
    memberCount: 6,
    followerCount: 45300,
    exploreExposed: true,
    description: 'MADEIN(메이딘)은 2024년 데뷔 이후, 감각적인 사운드와 깊이 있는 메시지로 주목받고 있는 신예 아티스트입니다.',
    updatedAt: '2026.02.11 11:45',
  },
  {
    id: 5,
    status: 'Active',
    name: 'iKON',
    memberCount: 6,
    followerCount: 512800,
    exploreExposed: true,
    description: 'iKON은 YG 엔터테인먼트 출신의 143엔터테인먼트 소속으로 대한민국 6인조 남성 아이돌 음악 그룹이다. 멤버는 김진환, 송윤형, BOBBY, 김동혁, 구준회, 정찬우로 구성되어 있다',
    updatedAt: '2026.02.11 11:45',
  },
];

// 69 멤버 — 운영 BO /artists/members 전수 실측 (Active 68 + Inactive 1, 업데이트 일시 내림차순)
type MemberSeed = [name: string, gender: '여자' | '남자', birthday: string, updatedAt: string];
const ACTIVE_SEED: MemberSeed[] = [
  ['오카다 호노카', '여자', '2003.10.10', '2026.02.10 13:04'],
  ['후지타 유메', '여자', '2004.04.01', '2026.02.10 13:02'],
  ['마에다 시오리', '여자', '2001.07.19', '2026.02.10 13:00'],
  ['이시카와 루나', '여자', '2002.10.15', '2026.02.10 12:58'],
  ['하시모토 코하루', '여자', '2006.03.21', '2026.02.10 12:56'],
  ['이케다 유우', '여자', '2003.06.30', '2026.02.10 12:54'],
  ['모리타 카나데', '여자', '2004.08.08', '2026.02.10 12:52'],
  ['시미즈 아야카', '여자', '2005.01.03', '2026.02.10 12:50'],
  ['하야시 미사키', '여자', '2002.04.10', '2026.02.10 12:47'],
  ['키무라 유키노', '여자', '2003.12.20', '2026.02.10 12:41'],
  ['이노우에 마오', '여자', '2000.11.22', '2026.02.10 12:39'],
  ['마츠모토 아이', '여자', '2004.02.28', '2026.02.10 12:37'],
  ['사사키 츠키노', '여자', '2005.09.05', '2026.02.10 12:35'],
  ['야마다 치히로', '여자', '2001.05.25', '2026.02.10 12:32'],
  ['요시다 코토네', '여자', '2003.02.12', '2026.02.10 12:30'],
  ['가토 리코', '여자', '2004.09.18', '2026.02.10 12:28'],
  ['고바야시 히카리', '여자', '2002.06.21', '2026.02.10 12:26'],
  ['나카무라 사쿠라', '여자', '2005.03.30', '2026.02.10 12:24'],
  ['야마모토 카에데', '여자', '2003.11.15', '2026.02.10 12:22'],
  ['이토 나나미', '여자', '2006.07.07', '2026.02.10 12:20'],
  ['와타나베 유이', '여자', '2001.03.10', '2026.02.10 12:18'],
  ['다카하시 아카리', '여자', '2004.12.24', '2026.02.10 12:16'],
  ['스즈키 린', '여자', '2002.08.16', '2026.02.10 12:14'],
  ['다나카 하나', '여자', '2005.04.03', '2026.02.10 12:12'],
  ['사토 미츠키', '여자', '2003.01.25', '2026.02.10 12:10'],
  ['차예나', '여자', '2004.02.14', '2026.02.10 12:08'],
  ['남보라', '여자', '2000.10.31', '2026.02.10 12:06'],
  ['진아라', '여자', '2005.05.05', '2026.02.10 12:05'],
  ['유하영', '여자', '2001.02.09', '2026.02.10 12:02'],
  ['노은서', '여자', '2003.09.29', '2026.02.10 12:00'],
  ['홍채림', '여자', '2004.06.14', '2026.02.10 11:58'],
  ['권소윤', '여자', '2002.01.18', '2026.02.10 11:56'],
  ['장미래', '여자', '2005.11.11', '2026.02.10 11:55'],
  ['류아인', '여자', '2003.07.07', '2026.02.10 11:52'],
  ['배수현', '여자', '1998.03.22', '2026.02.10 11:49'],
  ['문세은', '여자', '2004.12.01', '2026.02.10 11:46'],
  ['안지아', '여자', '2002.08.31', '2026.02.10 11:44'],
  ['신하린', '여자', '2006.04.20', '2026.02.10 11:41'],
  ['임소희', '여자', '2001.06.15', '2026.02.10 11:38'],
  ['서은비', '여자', '2003.10.07', '2026.02.10 11:35'],
  ['오유진', '여자', '2005.02.28', '2026.02.10 10:42'],
  ['강다현', '여자', '1999.04.11', '2026.02.10 10:31'],
  ['윤채원', '여자', '2004.08.03', '2026.02.10 10:27'],
  ['송민지', '여자', '2000.12.25', '2026.02.10 09:51'],
  ['한나은', '여자', '2003.05.19', '2026.02.10 10:38'],
  ['최수아', '여자', '2001.09.14', '2026.02.10 10:37'],
  ['정예린', '여자', '2006.01.30', '2026.02.10 10:37'],
  ['박지우', '여자', '2002.11.08', '2026.02.10 09:36'],
  ['이서연', '여자', '2005.07.22', '2026.02.10 10:36'],
  ['김하늘', '여자', '2004.03.15', '2026.02.10 10:32'],
  ['송유찬', '남자', '1995.01.01', '2026.02.03 17:16'],
  ['정지섭', '남자', '2001.01.01', '2026.02.03 17:15'],
  ['케빈박', '남자', '2001.01.01', '2026.02.03 17:13'],
  ['신노스케', '남자', '2005.01.01', '2026.02.03 17:12'],
  ['조주연', '남자', '2000.05.08', '2026.02.03 16:48'],
  ['CELEBUS', '여자', '2026.01.01', '2026.01.29 12:34'],
  ['나고미', '여자', '2007.07.02', '2026.01.29 12:01'],
  ['세리나', '여자', '2006.05.03', '2026.01.29 11:57'],
  ['예서', '여자', '2005.08.22', '2026.01.29 11:53'],
  ['수혜', '여자', '2004.12.13', '2026.01.29 11:50'],
  ['미유', '여자', '2003.01.09', '2026.01.29 11:47'],
  ['마시로', '여자', '1999.12.16', '2026.01.29 11:46'],
  ['정찬우', '남자', '1998.01.26', '2026.01.29 11:18'],
  ['구준회', '남자', '1997.03.31', '2026.01.29 11:16'],
  ['김동혁', '남자', '1997.01.03', '2026.01.29 11:13'],
  ['Bobby', '남자', '1995.12.21', '2026.01.29 11:10'],
  ['송윤형', '남자', '1995.02.08', '2026.01.29 11:07'],
  ['김진환', '남자', '1994.02.07', '2026.01.29 11:05'],
];

export const artistMembers: ArtistMember[] = [
  ...ACTIVE_SEED.map((s, i) => ({
    id: i + 1,
    status: 'Active' as ArtistStatus,
    name: s[0],
    groupCount: 1,
    birthday: s[2],
    gender: s[1],
    updatedAt: s[3],
  })),
  { id: 69, status: 'Inactive', name: '테스트', groupCount: 0, birthday: '2005.02.09', gender: '남자', updatedAt: '2026.02.10 10:44' },
];

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

// 포지션·소속사 — 운영 BO 실측 (운영자 노출명 + 유저 노출명 KO/EN/JP + 상태)
export type SettingStatus = '사용' | '미사용';

export interface ArtistPosition {
  id: number;
  status: SettingStatus;
  operatorName: string; // 운영자 노출명
  nameKO: string;
  nameEN: string;
  nameJP: string;
}

export interface ArtistAgency {
  id: number;
  status: SettingStatus;
  operatorName: string;
  nameKO: string;
  nameEN: string;
  nameJP: string;
}

// 운영 BO /artists/groups/positions 실측 (16건, 전부 사용)
export const artistPositions: ArtistPosition[] = [
  { id: 1, status: '사용', operatorName: '드럼', nameKO: '드럼', nameEN: 'Drums', nameJP: 'ドラム' },
  { id: 2, status: '사용', operatorName: '기타', nameKO: '기타', nameEN: 'Guitar', nameJP: 'ギター' },
  { id: 3, status: '사용', operatorName: '키보드', nameKO: '키보드', nameEN: 'Keyboard', nameJP: 'キーボード' },
  { id: 4, status: '사용', operatorName: '베이스', nameKO: '베이스', nameEN: 'Bass', nameJP: 'ベース' },
  { id: 5, status: '사용', operatorName: '막내', nameKO: '막내', nameEN: 'Maknae', nameJP: 'マンネ' },
  { id: 6, status: '사용', operatorName: '리더, 메인 보컬', nameKO: '리더, 메인 보컬', nameEN: 'Leader, Main Vocal', nameJP: 'リーダー, メインボーカル' },
  { id: 7, status: '사용', operatorName: '리드 래퍼', nameKO: '리드 래퍼', nameEN: 'Lead Rapper', nameJP: 'リードラッパー' },
  { id: 8, status: '사용', operatorName: '메인 래퍼', nameKO: '메인 래퍼', nameEN: 'Main Rapper', nameJP: 'メインラッパー' },
  { id: 9, status: '사용', operatorName: '리드 댄서', nameKO: '리드 댄서', nameEN: 'Lead Dancer', nameJP: 'リードダンサー' },
  { id: 10, status: '사용', operatorName: '메인 댄서', nameKO: '메인 댄서', nameEN: 'Main Dancer', nameJP: 'メインダンサー' },
  { id: 11, status: '사용', operatorName: '서브 보컬', nameKO: '서브 보컬', nameEN: 'Sub Vocal', nameJP: 'サブボーカル' },
  { id: 12, status: '사용', operatorName: '리드 보컬', nameKO: '리드 보컬', nameEN: 'Lead Vocal', nameJP: 'リードボーカル' },
  { id: 13, status: '사용', operatorName: '메인 보컬', nameKO: '메인 보컬', nameEN: 'Main Vocal', nameJP: 'メインボーカル' },
  { id: 14, status: '사용', operatorName: '비주얼', nameKO: '비주얼', nameEN: 'Visual', nameJP: 'ビジュアル' },
  { id: 15, status: '사용', operatorName: '센터', nameKO: '센터', nameEN: 'Center', nameJP: 'センター' },
  { id: 16, status: '사용', operatorName: '리더', nameKO: '리더', nameEN: 'Leader', nameJP: 'リーダー' },
];

// 운영 BO /artists/members/agencies 실측 (기본 '소속사 없음' 1건)
export const artistAgencies: ArtistAgency[] = [
  { id: 1, status: '사용', operatorName: '소속사 없음', nameKO: '소속사 없음', nameEN: 'No agency', nameJP: '所属事務所なし' },
];

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
