'use client';

import { create } from 'zustand';

interface DailyUIState {
  expandedBonusId: number | null;
  setExpandedBonusId: (id: number | null) => void;
}

export const useDailyStore = create<DailyUIState>((set) => ({
  expandedBonusId: null,
  setExpandedBonusId: (id) => set({ expandedBonusId: id }),
}));
