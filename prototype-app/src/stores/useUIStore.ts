'use client';

import { create } from 'zustand';
import type { ToastMessage, ToastType } from '@/lib/types';

interface UIState {
  toasts: ToastMessage[];
  showOnboarding: boolean;
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
  setShowOnboarding: (show: boolean) => void;
}

let toastCounter = 0;

export const useUIStore = create<UIState>((set, get) => ({
  toasts: [],
  showOnboarding: false,
  addToast: (type, message) => {
    const id = `toast-${++toastCounter}`;
    const toast: ToastMessage = { id, type, message };
    const current = get().toasts;
    const updated = current.length >= 3
      ? [...current.slice(1), toast]
      : [...current, toast];
    set({ toasts: updated });
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
  setShowOnboarding: (show) => set({ showOnboarding: show }),
}));
