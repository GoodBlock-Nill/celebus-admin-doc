'use client';

import { create } from 'zustand';
import type { DailyState } from '@/lib/types';
import { MOCK_DAILY } from '@/mock/daily';

interface DailyStoreState extends DailyState {
  checkIn: () => void;
  completeMission: () => void;
  claimBonus: (days: number) => void;
  reset: () => void;
}

export const useDailyStore = create<DailyStoreState>((set, get) => ({
  ...MOCK_DAILY,

  checkIn: () => {
    const state = get();
    if (state.checkedIn) return;
    const newStreak = state.streak + 1;
    const dayIndex = new Date().getDay();
    const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // 월=0, 일=6
    const newWeek = [...state.weekRecord];
    newWeek[adjustedIndex] = true;
    set({ checkedIn: true, streak: newStreak, weekRecord: newWeek });
  },

  completeMission: () => {
    const state = get();
    if (state.mission.completed) return;
    set({ mission: { ...state.mission, completed: true } });
  },

  claimBonus: (days) => {
    set((state) => ({
      bonuses: state.bonuses.map((b) =>
        b.days === days ? { ...b, claimed: true } : b
      ),
    }));
  },

  reset: () => {
    set({ ...MOCK_DAILY });
  },
}));
