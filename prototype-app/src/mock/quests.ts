import type { QuestChapter, QuestMission, RepeatingQuest } from '@/lib/types';

export const MOCK_CHAPTERS: QuestChapter[] = [
  {
    id: 'ch1',
    number: 1,
    title: 'V01D를 만나다',
    description: 'V01D의 공식 채널을 팔로우하고 첫 만남을 시작하세요',
    status: 'active',
    missions: [
      { id: 'm1-1', title: 'V01D 공식 X 팔로우', type: 'capture', status: 'APPROVED', rewardText: '덕력 50pt', relatedLinks: [{ label: 'X 프로필 열기', url: 'https://x.com/V01D_iX' }] },
      { id: 'm1-2', title: 'V01D 공식 IG 팔로우', type: 'capture', status: 'SUBMITTED', rewardText: '덕력 50pt', relatedLinks: [{ label: 'Instagram 열기', url: 'https://instagram.com/v01d_ix' }] },
      { id: 'm1-3', title: 'V01D 공식 YouTube 구독', type: 'capture', status: 'INCOMPLETE', rewardText: '응모권 1장', relatedLinks: [{ label: 'YouTube 채널', url: 'https://youtube.com/@v01d' }] },
    ],
    goodsName: '스토리의 시작',
    goodsGrade: 1,
    goodsClaimed: false,
    missionHint: 'SNS 팔로우',
  },
  {
    id: 'ch2',
    number: 2,
    title: 'V01D를 듣다',
    description: 'V01D의 음악을 듣고 감상을 기록하세요',
    status: 'locked',
    missions: [
      { id: 'm2-1', title: '"Tug of War" 스트리밍 인증', type: 'capture', status: 'INCOMPLETE', rewardText: '덕력 80pt', relatedLinks: [{ label: 'Spotify 열기', url: 'https://open.spotify.com' }] },
      { id: 'm2-2', title: '"ROCKROCK" MV 시청 인증', type: 'capture', status: 'INCOMPLETE', rewardText: '덕력 80pt', relatedLinks: [{ label: 'YouTube MV', url: 'https://youtube.com' }] },
      { id: 'm2-3', title: 'V01D 앨범 감상 소감 인증', type: 'capture', status: 'INCOMPLETE', rewardText: '응모권 1장' },
    ],
    goodsName: '성장 스토리',
    goodsGrade: 2,
    goodsClaimed: false,
    missionHint: '스트리밍 인증',
  },
  {
    id: 'ch3',
    number: 3,
    title: 'V01D를 알다',
    description: 'V01D에 대한 퀴즈에 도전해보세요! Trivia 게임 참여',
    status: 'locked',
    missions: [
      { id: 'm3-1', title: 'V01D Trivia 1차 도전 (7/10 이상)', type: 'trivia', status: 'INCOMPLETE', rewardText: '덕력 50pt' },
      { id: 'm3-2', title: 'V01D Trivia 2차 도전 (7/10 이상)', type: 'trivia', status: 'INCOMPLETE', rewardText: '덕력 50pt' },
      { id: 'm3-3', title: 'V01D Trivia 최종 도전 (8/10 이상)', type: 'trivia', status: 'INCOMPLETE', rewardText: '응모권 2장' },
    ],
    goodsName: '아티스트의 꿈',
    goodsGrade: 3,
    goodsClaimed: false,
    missionHint: 'Trivia (자동검증)',
  },
  {
    id: 'ch4',
    number: 4,
    title: 'V01D를 예측하다',
    description: 'V01D의 미래를 예측해보세요! PM 게임 참여',
    status: 'locked',
    missions: [
      { id: 'm4-1', title: 'V01D PM 게임 1회 참여', type: 'pm', status: 'INCOMPLETE', rewardText: '덕력 50pt' },
      { id: 'm4-2', title: 'V01D PM 게임 2회 참여', type: 'pm', status: 'INCOMPLETE', rewardText: '덕력 50pt' },
      { id: 'm4-3', title: 'V01D PM 게임 3회 참여', type: 'pm', status: 'INCOMPLETE', rewardText: '응모권 3장' },
    ],
    goodsName: '아티스트의 준비',
    goodsGrade: 4,
    goodsClaimed: false,
    missionHint: 'PM (자동검증)',
  },
  {
    id: 'ch5',
    number: 5,
    title: 'V01D를 응원하다',
    description: 'V01D를 세상에 알리는 서포트에 함께하세요',
    status: 'locked',
    missions: [
      { id: 'm5-1', title: 'V01D 서포트 X 게시 (@celebus @V01D 태그)', type: 'capture', status: 'INCOMPLETE', rewardText: '덕력 50pt', relatedLinks: [{ label: 'X에 게시하기', url: 'https://x.com' }] },
      { id: 'm5-2', title: 'V01D 서포트 IG 스토리 공유', type: 'capture', status: 'INCOMPLETE', rewardText: '덕력 50pt', relatedLinks: [{ label: 'Instagram 열기', url: 'https://instagram.com' }] },
      { id: 'm5-3', title: 'V01D 응원 메시지 작성', type: 'capture', status: 'INCOMPLETE', rewardText: '응모권 3장' },
    ],
    goodsName: '아티스트의 데뷔',
    goodsGrade: 5,
    goodsClaimed: false,
    missionHint: 'SNS 게시 인증',
  },
];

// 장별 프리셋 생성: N장 활성 (이전 장 cleared, 이후 장 locked)
function makeChapterPreset(activeChapter: number): QuestChapter[] {
  return MOCK_CHAPTERS.map((ch) => {
    if (ch.number < activeChapter) {
      return {
        ...ch,
        status: 'cleared' as const,
        goodsClaimed: true,
        missions: ch.missions.map((m) => ({
          ...m,
          status: (m.type === 'trivia' || m.type === 'pm' ? 'AUTO_COMPLETED' : 'APPROVED') as QuestMission['status'],
        })),
      };
    }
    if (ch.number === activeChapter) {
      return {
        ...ch,
        status: 'active' as const,
        goodsClaimed: false,
        missions: ch.missions.map((m, i) => {
          if (i === 0) return { ...m, status: 'APPROVED' as const };
          if (i === 1) return { ...m, status: 'SUBMITTED' as const };
          return { ...m, status: 'INCOMPLETE' as const };
        }),
      };
    }
    return { ...ch, status: 'locked' as const, goodsClaimed: false };
  });
}

export const MOCK_PRESETS = {
  ch1: makeChapterPreset(1),
  ch2: makeChapterPreset(2),
  ch3: makeChapterPreset(3),
  ch4: makeChapterPreset(4),
  ch5: makeChapterPreset(5),
  complete: MOCK_CHAPTERS.map((ch) => ({
    ...ch,
    status: 'cleared' as const,
    goodsClaimed: ch.number <= 4,
    missions: ch.missions.map((m) => ({
      ...m,
      status: (m.type === 'trivia' || m.type === 'pm' ? 'AUTO_COMPLETED' : 'APPROVED') as QuestMission['status'],
    })),
  })),
};

export type PresetKey = keyof typeof MOCK_PRESETS;

export const MOCK_REPEATING_QUESTS: RepeatingQuest[] = [
  {
    id: 'rq-1',
    title: '[4/14~4/20] 스트리밍 인증',
    period: '04.14 ~ 04.20',
    missionCount: 2,
    rewardText: '덕력 50pt',
    status: 'active',
  },
  {
    id: 'rq-2',
    title: '[4/14~4/20] SNS 공유',
    period: '04.14 ~ 04.20',
    missionCount: 1,
    rewardText: '응모권 2장',
    status: 'active',
  },
];
