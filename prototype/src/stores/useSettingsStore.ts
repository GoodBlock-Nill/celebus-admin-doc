import { create } from 'zustand';
import type { RankingSettings, ExchangeSettings } from '@/lib/types';
import { defaultRankingSettings, defaultExchangeSettings } from '@/mock/settings';

interface SettingsStore {
  rankingSettings: RankingSettings;
  exchangeSettings: ExchangeSettings;

  updateRankingSettings: (settings: Partial<RankingSettings>) => void;
  resetRankingSettings: () => void;
  updateExchangeSettings: (settings: Partial<ExchangeSettings>) => void;
  resetExchangeSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  rankingSettings: { ...defaultRankingSettings },
  exchangeSettings: { ...defaultExchangeSettings },

  updateRankingSettings: (settings) => set((state) => ({
    rankingSettings: { ...state.rankingSettings, ...settings },
  })),
  resetRankingSettings: () => set({ rankingSettings: { ...defaultRankingSettings } }),

  updateExchangeSettings: (settings) => set((state) => ({
    exchangeSettings: { ...state.exchangeSettings, ...settings },
  })),
  resetExchangeSettings: () => set({ exchangeSettings: { ...defaultExchangeSettings } }),
}));
