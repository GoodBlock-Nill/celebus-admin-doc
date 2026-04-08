import { create } from 'zustand';
import type { Game, GameStatus, GameType } from '@/lib/types';
import { mockGames } from '@/mock/games';

interface GameFilters {
  type: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

interface GameStore {
  games: Game[];
  filters: GameFilters;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  currentPage: number;

  setFilters: (filters: Partial<GameFilters>) => void;
  resetFilters: () => void;
  setSort: (key: string) => void;
  setPage: (page: number) => void;

  getFilteredGames: () => Game[];
  getGameById: (id: string) => Game | undefined;

  addGame: (game: Game) => void;
  updateGame: (id: string, updates: Partial<Game>) => void;
  deleteGame: (id: string) => void;
  changeGameStatus: (id: string, newStatus: GameStatus) => void;
  setGameResult: (id: string, result: 'YES' | 'NO', resultTitle: { ko: string; en: string; jp: string }, resultDescription: { ko: string; en: string; jp: string }, resultLinkText?: { ko: string; en: string; jp: string }, resultLinkUrl?: { ko: string; en: string; jp: string }) => void;
  distributeReward: (id: string) => void;
}

const DEFAULT_FILTERS: GameFilters = {
  type: 'PREDICTION_MARKET',
  status: '',
  dateFrom: '',
  dateTo: '',
  search: '',
};

export const useGameStore = create<GameStore>((set, get) => ({
  games: [...mockGames],
  filters: { ...DEFAULT_FILTERS },
  sortBy: 'createdAt',
  sortOrder: 'desc',
  currentPage: 1,

  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
    currentPage: 1,
  })),

  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS }, currentPage: 1 }),

  setSort: (key) => set((state) => ({
    sortBy: key,
    sortOrder: state.sortBy === key && state.sortOrder === 'asc' ? 'desc' : 'asc',
  })),

  setPage: (page) => set({ currentPage: page }),

  getFilteredGames: () => {
    const { games, filters, sortBy, sortOrder } = get();
    let filtered = [...games];

    if (filters.type) {
      filtered = filtered.filter(g => g.type === filters.type);
    }
    if (filters.status) {
      filtered = filtered.filter(g => g.status === filters.status);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter(g =>
        g.title.ko.toLowerCase().includes(s) ||
        g.title.en.toLowerCase().includes(s)
      );
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(g => g.createdAt >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(g => g.createdAt <= filters.dateTo);
    }

    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof Game];
      const bVal = b[sortBy as keyof Game];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    return filtered;
  },

  getGameById: (id) => get().games.find(g => g.id === id),

  addGame: (game) => set((state) => {
    const finalGame = { ...game };
    // 타입2 자동 계산: totalPrizeGP = winRewardGP × maxParticipants
    if (game.type === 'PREDICTION_MARKET' && game.pmType === 'type2' && game.winRewardGP && game.maxParticipants > 0) {
      finalGame.totalPrizeGP = game.winRewardGP * game.maxParticipants;
    }
    return { games: [finalGame, ...state.games] };
  }),

  updateGame: (id, updates) => set((state) => ({
    games: state.games.map(g => g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g),
  })),

  deleteGame: (id) => set((state) => ({
    games: state.games.filter(g => g.id !== id),
  })),

  changeGameStatus: (id, newStatus) => set((state) => ({
    games: state.games.map(g => {
      if (g.id !== id) return g;
      const updates: Partial<Game> = {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
      // 게시 시 publishedAt 설정 (Active로 변경 시)
      if (newStatus === 'Active' && !g.publishedAt) {
        updates.publishedAt = new Date().toISOString();
      }
      return { ...g, ...updates };
    }),
  })),

  setGameResult: (id, result, resultTitle, resultDescription, resultLinkText, resultLinkUrl) => set((state) => ({
    games: state.games.map(g => g.id === id ? {
      ...g,
      result,
      resultTitle: resultTitle || g.resultTitle,
      resultDescription: resultDescription || g.resultDescription,
      resultLinkText: resultLinkText || g.resultLinkText,
      resultLinkUrl: resultLinkUrl || g.resultLinkUrl,
      status: 'Closed' as GameStatus,
      updatedAt: new Date().toISOString(),
    } : g),
  })),

  distributeReward: (id) => set((state) => ({
    games: state.games.map(g => g.id === id ? {
      ...g,
      status: 'Ended' as GameStatus,
      rewardDistributed: true,
      rewardDistributedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } : g),
  })),
}));
