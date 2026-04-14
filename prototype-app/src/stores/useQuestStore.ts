'use client';

import { create } from 'zustand';
import type { QuestChapter, RepeatingQuest, MissionStatus } from '@/lib/types';
import { MOCK_PRESETS, MOCK_REPEATING_QUESTS } from '@/mock/quests';
import type { PresetKey } from '@/mock/quests';

interface QuestState {
  chapters: QuestChapter[];
  repeatingQuests: RepeatingQuest[];
  isStoryComplete: boolean;
  expandedChapterId: string | null;
  currentPreset: PresetKey;
  toggleChapter: (id: string) => void;
  updateMissionStatus: (chapterId: string, missionId: string, status: MissionStatus) => void;
  claimGoods: (chapterId: string) => void;
  refresh: () => void;
  setPreset: (preset: PresetKey) => void;
}

function checkStoryComplete(chapters: QuestChapter[]): boolean {
  return chapters.every((ch) => ch.status === 'cleared');
}

function getAutoExpandId(chapters: QuestChapter[]): string | null {
  const priority: QuestChapter['status'][] = ['active', 'provisional', 'reviewing', 'cleared'];
  for (const status of priority) {
    const ch = chapters.find((c) => c.status === status);
    if (ch) return ch.id;
  }
  return null;
}

const initialData = MOCK_PRESETS.ch1;

export const useQuestStore = create<QuestState>((set, get) => ({
  chapters: initialData,
  repeatingQuests: MOCK_REPEATING_QUESTS,
  isStoryComplete: checkStoryComplete(initialData),
  expandedChapterId: getAutoExpandId(initialData),
  currentPreset: 'ch1' as PresetKey,

  toggleChapter: (id) => {
    const current = get().expandedChapterId;
    set({ expandedChapterId: current === id ? null : id });
  },

  updateMissionStatus: (chapterId, missionId, status) => {
    set((state) => ({
      chapters: state.chapters.map((ch) =>
        ch.id === chapterId
          ? {
              ...ch,
              missions: ch.missions.map((m) =>
                m.id === missionId ? { ...m, status } : m
              ),
            }
          : ch
      ),
    }));
  },

  claimGoods: (chapterId) => {
    set((state) => ({
      chapters: state.chapters.map((ch) =>
        ch.id === chapterId ? { ...ch, goodsClaimed: true } : ch
      ),
    }));
  },

  refresh: () => {
    const preset = get().currentPreset;
    const data = MOCK_PRESETS[preset];
    set({
      chapters: [...data],
      isStoryComplete: checkStoryComplete(data),
      expandedChapterId: getAutoExpandId(data),
    });
  },

  setPreset: (preset) => {
    const data = MOCK_PRESETS[preset];
    set({
      currentPreset: preset,
      chapters: [...data],
      isStoryComplete: checkStoryComplete(data),
      expandedChapterId: getAutoExpandId(data),
    });
  },
}));
