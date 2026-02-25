'use client';

import { create } from 'zustand';
import type { User } from '@/lib/types';
import { mockUser } from '@/mock/user';

interface UserState {
  user: User;
  updateGPBalance: (amount: number) => void;
  updateCELBBalance: (amount: number) => void;
  updateHearts: (delta: number) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: mockUser,

  updateGPBalance: (amount) =>
    set((state) => ({
      user: { ...state.user, gpBalance: state.user.gpBalance + amount },
    })),

  updateCELBBalance: (amount) =>
    set((state) => ({
      user: { ...state.user, celbBalance: state.user.celbBalance + amount },
    })),

  updateHearts: (delta) =>
    set((state) => ({
      user: {
        ...state.user,
        hearts: Math.max(0, state.user.hearts + delta),
      },
    })),
}));
