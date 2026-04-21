'use client';

import { create } from 'zustand';
import { toast } from 'sonner';
import type { ToastType } from '@/lib/types';

interface UIState {
  showOnboarding: boolean;
  addToast: (type: ToastType, message: string) => void;
  setShowOnboarding: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  showOnboarding: false,
  addToast: (type, message) => {
    if (type === 'success') toast.success(message);
    else if (type === 'error') toast.error(message);
    else toast.info(message);
  },
  setShowOnboarding: (show) => set({ showOnboarding: show }),
}));
