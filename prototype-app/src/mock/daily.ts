import type { DailyState } from '@/lib/types';

const MISSION_POOL = [
  { id: 'dm-1', title: 'V01D 페이지 방문', description: 'V01D 탭에 방문하면 완료', targetHref: '/artist' },
  { id: 'dm-2', title: '게임존 방문', description: '게임존 탭에 방문하면 완료', targetHref: '/game' },
  { id: 'dm-3', title: '기억저장소 방문', description: '기억저장소에 방문하면 완료', targetHref: '/memory' },
  { id: 'dm-4', title: '덕력 랭킹 확인', description: '덕력 랭킹을 확인하면 완료', targetHref: '/virtue' },
  { id: 'dm-5', title: '래플 확인', description: '래플 리스트를 확인하면 완료', targetHref: '/raffle' },
  { id: 'dm-6', title: '컬렉션 확인', description: '디지털 굿즈 컬렉션을 확인하면 완료', targetHref: '/collection' },
  { id: 'dm-7', title: '서포트 이벤트 확인', description: '서포트 이벤트를 확인하면 완료', targetHref: '/support' },
  { id: 'dm-8', title: '아티스트 정보 확인', description: '아티스트 정보 피드를 확인하면 완료', targetHref: '/info' },
];

const todayIndex = new Date().getDay(); // 0=일, 1=월...
const missionIndex = todayIndex % MISSION_POOL.length;

export const MOCK_DAILY: DailyState = {
  checkedIn: false,
  mission: {
    ...MISSION_POOL[missionIndex],
    rewardPt: 20,
    completed: false,
  },
  streak: 12,
  weekRecord: [true, true, true, false, false, false, false], // 월~일
  bonuses: [
    { days: 7, rewardPt: 200, claimed: true },
    { days: 14, rewardPt: 500, claimed: false },
    { days: 30, rewardPt: 1000, claimed: false },
    { days: 100, rewardPt: 5000, claimed: false },
  ],
};
