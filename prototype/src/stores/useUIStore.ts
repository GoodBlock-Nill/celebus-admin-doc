import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

interface UIStore {
  // Modal state
  activeModal: string | null;
  modalData: Record<string, unknown>;
  openModal: (modalId: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Toast state
  toasts: Toast[];
  addToast: (type: 'success' | 'error', message: string) => void;
  removeToast: (id: string) => void;

  // Tab state
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activeModal: null,
  modalData: {},
  openModal: (modalId, data = {}) => set({ activeModal: modalId, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: {} }),

  toasts: [],
  addToast: (type, message) => {
    const id = Math.random().toString(36).substring(2, 8);
    set((state) => {
      const newToasts = [...state.toasts, { id, type, message }];
      if (newToasts.length > 3) {
        return { toasts: newToasts.slice(-3) };
      }
      return { toasts: newToasts };
    });
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id),
      }));
    }, 3000);
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id),
  })),

  activeTab: 'basic',
  setActiveTab: (tab) => set({ activeTab: tab }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
