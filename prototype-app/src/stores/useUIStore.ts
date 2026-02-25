'use client';

import { create } from 'zustand';
import { generateId } from '@/lib/utils';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface UIState {
  activeModal: string | null;
  modalData: Record<string, unknown> | null;
  toasts: Toast[];
  openModal: (name: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  addToast: (message: string, type: 'success' | 'error') => void;
  removeToast: (id: string) => void;
}

const MAX_TOASTS = 3;
const TOAST_DURATION_MS = 3000;

export const useUIStore = create<UIState>((set) => ({
  activeModal: null,
  modalData: null,
  toasts: [],

  openModal: (name, data = undefined) => set({ activeModal: name, modalData: data ?? null }),

  closeModal: () => set({ activeModal: null, modalData: null }),

  addToast: (message, type) => {
    const id = generateId();
    set((state) => {
      const current = state.toasts;
      const trimmed = current.length >= MAX_TOASTS ? current.slice(1) : current;
      return { toasts: [...trimmed, { id, message, type }] };
    });
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, TOAST_DURATION_MS);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
