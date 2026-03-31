import type { Chapter } from '@/lib/fq-types';

export const mockChapters: Chapter[] = [
  {
    id: 'ch-1',
    number: 1,
    title: 'V01D를 만나다',
    subtitle: 'V01D의 세계로 첫 발걸음',
    status: 'COMPLETED',
    completedAt: '2026-04-03T14:30:00Z',
    reward: { tickets: 3, bonusContent: null, digitalPhotocard: null },
    missions: [
      { id: 'm-1-1', chapterId: 'ch-1', type: 'QUEST', title: 'V01D 공식 X(@V01D_iX) 팔로우', description: 'V01D 공식 X 계정을 팔로우하고 인증해주세요', status: 'COMPLETED', targetValue: 1, currentValue: 1, rewardTickets: 1 },
      { id: 'm-1-2', chapterId: 'ch-1', type: 'QUEST', title: 'V01D 공식 Instagram(v01d_ix) 팔로우', description: 'V01D 공식 인스타그램을 팔로우하고 인증해주세요', status: 'COMPLETED', targetValue: 1, currentValue: 1, rewardTickets: 1 },
      { id: 'm-1-3', chapterId: 'ch-1', type: 'QUEST', title: 'V01D 공식 YouTube 구독', description: 'V01D 공식 유튜브 채널을 구독하고 인증해주세요', status: 'COMPLETED', targetValue: 1, currentValue: 1, rewardTickets: 1 },
    ],
  },
  {
    id: 'ch-2',
    number: 2,
    title: 'V01D를 듣다',
    subtitle: 'V01D의 음악에 빠지다',
    status: 'COMPLETED',
    completedAt: '2026-04-05T18:00:00Z',
    reward: { tickets: 4, bonusContent: null, digitalPhotocard: null },
    missions: [
      { id: 'm-2-1', chapterId: 'ch-2', type: 'QUEST', title: 'Tug of War 스트리밍 인증', description: 'Tug of War를 스트리밍하고 캡처를 업로드해주세요', status: 'COMPLETED', targetValue: 1, currentValue: 1, rewardTickets: 2 },
      { id: 'm-2-2', chapterId: 'ch-2', type: 'QUEST', title: 'ROCKROCK 스트리밍 인증', description: 'ROCKROCK을 스트리밍하고 캡처를 업로드해주세요', status: 'COMPLETED', targetValue: 1, currentValue: 1, rewardTickets: 2 },
    ],
  },
  {
    id: 'ch-3',
    number: 3,
    title: 'V01D를 알다',
    subtitle: 'V01D에 대해 얼마나 알고 있나요?',
    status: 'IN_PROGRESS',
    completedAt: null,
    reward: { tickets: 3, bonusContent: 'V01D 비하인드 사진 3장', digitalPhotocard: null },
    missions: [
      { id: 'm-3-1', chapterId: 'ch-3', type: 'TRIVIA', title: 'V01D Trivia 도전', description: 'V01D에 관한 10문제 중 7개 이상 정답하세요', status: 'COMPLETED', targetValue: 7, currentValue: 8, rewardTickets: 2 },
      { id: 'm-3-2', chapterId: 'ch-3', type: 'QUEST', title: 'V01D 멤버 프로필 확인', description: '5명 멤버 프로필을 모두 확인해주세요', status: 'COMPLETED', targetValue: 5, currentValue: 5, rewardTickets: 0 },
      { id: 'm-3-3', chapterId: 'ch-3', type: 'QUEST', title: 'V01D 데뷔일 퀴즈 공유', description: 'V01D 데뷔일을 맞추고 결과를 SNS에 공유해주세요', status: 'AVAILABLE', targetValue: 1, currentValue: 0, rewardTickets: 1 },
    ],
  },
  {
    id: 'ch-4',
    number: 4,
    title: 'V01D를 예측하다',
    subtitle: 'V01D의 미래를 점쳐보세요',
    status: 'LOCKED',
    completedAt: null,
    reward: { tickets: 5, bonusContent: null, digitalPhotocard: null },
    missions: [
      { id: 'm-4-1', chapterId: 'ch-4', type: 'PM', title: 'V01D 관련 PM 참여 1', description: 'V01D 관련 Prediction Market에 참여해주세요', status: 'LOCKED', targetValue: 1, currentValue: 0, rewardTickets: 1 },
      { id: 'm-4-2', chapterId: 'ch-4', type: 'PM', title: 'V01D 관련 PM 참여 2', description: '두 번째 V01D PM에 참여해주세요', status: 'LOCKED', targetValue: 1, currentValue: 0, rewardTickets: 2 },
      { id: 'm-4-3', chapterId: 'ch-4', type: 'PM', title: 'V01D 관련 PM 참여 3', description: '세 번째 V01D PM에 참여해주세요', status: 'LOCKED', targetValue: 1, currentValue: 0, rewardTickets: 2 },
    ],
  },
  {
    id: 'ch-5',
    number: 5,
    title: 'V01D를 응원하다',
    subtitle: 'V01D에게 마음을 전해요',
    status: 'LOCKED',
    completedAt: null,
    reward: { tickets: 5, bonusContent: 'V01D 독점 셀카 + 보이스 메시지', digitalPhotocard: 'V01D 탐험 완료 한정판 디지털 포토카드' },
    missions: [
      { id: 'm-5-1', chapterId: 'ch-5', type: 'SNS_SHARE', title: 'V01D 응원 SNS 게시', description: '@celebus_official 태그와 함께 V01D 응원 게시물을 올려주세요', status: 'LOCKED', targetValue: 1, currentValue: 0, rewardTickets: 3 },
      { id: 'm-5-2', chapterId: 'ch-5', type: 'QUEST', title: 'V01D 팬레터 작성', description: 'CELEBUS 앱에서 V01D에게 팬레터를 작성해주세요', status: 'LOCKED', targetValue: 1, currentValue: 0, rewardTickets: 2 },
    ],
  },
];
