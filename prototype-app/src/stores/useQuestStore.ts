'use client';

import { create } from 'zustand';

interface QuestUIState {
  expandedChapterId: string | null;
  toggleChapter: (id: string) => void;
}

export const useQuestStore = create<QuestUIState>((set, get) => ({
  expandedChapterId: null,
  toggleChapter: (id) => set({ expandedChapterId: get().expandedChapterId === id ? null : id }),
}));
