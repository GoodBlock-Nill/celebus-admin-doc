import { create } from 'zustand';
import {
  dailyMissions as missionSeed,
  dailySettings as settingsSeed,
  streakMilestones as streakSeed,
  type DailyMission,
  type DailySettings,
  type StreakMilestone,
} from '@/mock/dailyMission';

// 세션 메모리 스토어 — 일일미션 관리.
// 미션 풀 CRUD는 즉시 반영. 보상값·스트릭 설정은 [변경사항 저장] 시 커밋.
// 새로고침 시 mock 초기값 복귀(프로토타입 동작).

export type MissionInput = {
  labelKO: string;
  labelEN: string;
  labelJA: string;
  descKO: string;
  descEN: string;
  descJA: string;
  targetScreen: string;
  active: boolean;
};

export type SettingsInput = {
  dailyCount: number;
  attendanceReward: number;
  missionReward: number;
  streak: StreakMilestone[];
};

interface DailyMissionState {
  missions: DailyMission[];
  settings: DailySettings;
  streak: StreakMilestone[];
  addMission: (data: MissionInput) => void;
  updateMission: (id: number, data: MissionInput) => void;
  removeMission: (id: number) => void;
  toggleMissionActive: (id: number) => boolean; // 변경 후 값 반환
  saveSettings: (input: SettingsInput) => void; // 보상값·스트릭 일괄 커밋
}

export const useDailyMissionStore = create<DailyMissionState>((set, get) => ({
  missions: missionSeed.map((m) => ({ ...m })),
  settings: { ...settingsSeed },
  streak: streakSeed.map((s) => ({ ...s })),

  addMission: (data) =>
    set((s) => {
      const nextId = s.missions.reduce((mx, m) => Math.max(mx, m.id), 0) + 1;
      return { missions: [...s.missions, { id: nextId, ...data }] };
    }),

  updateMission: (id, data) =>
    set((s) => ({ missions: s.missions.map((m) => (m.id === id ? { ...m, ...data } : m)) })),

  removeMission: (id) => set((s) => ({ missions: s.missions.filter((m) => m.id !== id) })),

  toggleMissionActive: (id) => {
    const next = !(get().missions.find((m) => m.id === id)?.active ?? true);
    set((s) => ({ missions: s.missions.map((m) => (m.id === id ? { ...m, active: next } : m)) }));
    return next;
  },

  saveSettings: (input) =>
    set((s) => ({
      settings: {
        ...s.settings,
        dailyCount: input.dailyCount,
        attendanceReward: input.attendanceReward,
        missionReward: input.missionReward,
      },
      streak: input.streak.map((m) => ({ ...m })),
    })),
}));
