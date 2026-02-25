'use client';

import { create } from 'zustand';
import type { Game, UserParticipation } from '@/lib/types';
import { mockGames, mockParticipations } from '@/mock/games';
import { generateId } from '@/lib/utils';

interface GameState {
  games: Game[];
  participations: Map<string, UserParticipation>;
  getGameById: (id: string) => Game | undefined;
  getActiveGames: () => Game[];
  participate: (gameId: string, choice: 'YES' | 'NO', gp: number) => void;
  boost: (gameId: string, gp: number) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  games: mockGames,
  participations: new Map(mockParticipations.map((p) => [p.gameId, p])),

  getGameById: (id) => get().games.find((g) => g.id === id),

  getActiveGames: () => get().games.filter((g) => g.status === 'Active'),

  participate: (gameId, choice, gp) => {
    const now = new Date().toISOString();
    set((state) => {
      const updatedGames = state.games.map((g) => {
        if (g.id !== gameId) return g;
        return {
          ...g,
          participantCount: g.participantCount + 1,
          yesCount: choice === 'YES' ? g.yesCount + 1 : g.yesCount,
          noCount: choice === 'NO' ? g.noCount + 1 : g.noCount,
        };
      });

      const existing = state.participations.get(gameId);
      const newParticipation: UserParticipation = existing
        ? { ...existing }
        : {
            gameId,
            choice,
            participationGP: gp,
            boostingGP: 0,
            status: 'PARTICIPATED',
            rewardGP: 0,
            refundGP: 0,
            participatedAt: now,
          };

      const newMap = new Map(state.participations);
      newMap.set(gameId, newParticipation);

      return { games: updatedGames, participations: newMap };
    });
  },

  boost: (gameId, gp) => {
    set((state) => {
      const existing = state.participations.get(gameId);
      if (!existing) return state;

      const updated: UserParticipation = {
        ...existing,
        boostingGP: existing.boostingGP + gp,
        status: 'BOOSTED',
      };

      const newMap = new Map(state.participations);
      newMap.set(gameId, updated);

      return { participations: newMap };
    });
  },
}));
