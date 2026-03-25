import { create } from 'zustand';
import type { Quest, QuestSubmission, RejectionReason, Raffle, QuestStatus, RaffleStatus } from '@/lib/fq-types';
import { mockQuests } from '@/mock/fq-quests';
import { mockSubmissions } from '@/mock/fq-submissions';
import { mockRejectionReasons } from '@/mock/fq-rejection-reasons';
import { generateId } from '@/lib/utils';

interface QuestFilters {
  status: string;
  searchField: string;
  searchQuery: string;
}

interface RaffleFilters {
  status: string;
  searchField: string;
  searchQuery: string;
}

interface FQState {
  // Quest data
  quests: Quest[];
  questFilters: QuestFilters;
  questPage: number;

  // Submissions
  submissions: QuestSubmission[];

  // Rejection reasons
  rejectionReasons: RejectionReason[];

  // Raffle data (Phase 2)
  raffles: Raffle[];
  raffleFilters: RaffleFilters;
  rafflePage: number;

  // Quest filter actions
  setQuestFilters: (filters: Partial<QuestFilters>) => void;
  resetQuestFilters: () => void;
  setQuestPage: (page: number) => void;
  getFilteredQuests: () => Quest[];
  getQuestById: (id: string) => Quest | undefined;

  // Quest CRUD
  createQuest: (quest: Omit<Quest, 'id' | 'status' | 'stats' | 'createdAt' | 'updatedAt' | 'startedAt'>) => Quest;
  updateQuest: (id: string, updates: Partial<Quest>) => void;
  deleteQuest: (id: string) => void;
  publishQuest: (id: string) => void;
  closeQuest: (id: string) => void;

  // Submission actions
  getSubmissionsByQuest: (questId: string) => QuestSubmission[];
  approveSubmission: (id: string) => void;
  rejectSubmission: (id: string, reason: string) => void;
  approveAllPending: (questId: string) => void;

  // Rejection reason actions
  addRejectionReason: (reason: Omit<RejectionReason, 'id' | 'createdAt'>) => void;
  updateRejectionReason: (id: string, updates: Partial<RejectionReason>) => void;

  // Raffle actions (stubs for Phase 2)
  setRaffleFilters: (filters: Partial<RaffleFilters>) => void;
  resetRaffleFilters: () => void;
  setRafflePage: (page: number) => void;
  getFilteredRaffles: () => Raffle[];
}

const DEFAULT_QUEST_FILTERS: QuestFilters = {
  status: '',
  searchField: 'title',
  searchQuery: '',
};

const DEFAULT_RAFFLE_FILTERS: RaffleFilters = {
  status: '',
  searchField: 'title',
  searchQuery: '',
};

export const useFQStore = create<FQState>((set, get) => ({
  quests: [...mockQuests],
  questFilters: { ...DEFAULT_QUEST_FILTERS },
  questPage: 1,

  submissions: [...mockSubmissions],

  rejectionReasons: [...mockRejectionReasons],

  raffles: [],
  raffleFilters: { ...DEFAULT_RAFFLE_FILTERS },
  rafflePage: 1,

  // --- Quest filter actions ---

  setQuestFilters: (filters) => set((state) => ({
    questFilters: { ...state.questFilters, ...filters },
    questPage: 1,
  })),

  resetQuestFilters: () => set({ questFilters: { ...DEFAULT_QUEST_FILTERS }, questPage: 1 }),

  setQuestPage: (page) => set({ questPage: page }),

  getFilteredQuests: () => {
    const { quests, questFilters } = get();
    let filtered = [...quests];

    if (questFilters.status) {
      filtered = filtered.filter((q) => q.status === questFilters.status);
    }

    if (questFilters.searchQuery) {
      const query = questFilters.searchQuery.toLowerCase();
      filtered = filtered.filter((q) => {
        switch (questFilters.searchField) {
          case 'title':
            return q.title.ko.toLowerCase().includes(query) || q.title.en.toLowerCase().includes(query);
          case 'artist':
            return q.artist.toLowerCase().includes(query);
          case 'id':
            return q.id.toLowerCase().includes(query);
          default:
            return q.title.ko.toLowerCase().includes(query);
        }
      });
    }

    // 최신순 정렬
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return filtered;
  },

  getQuestById: (id) => get().quests.find((q) => q.id === id),

  // --- Quest CRUD ---

  createQuest: (questData) => {
    const now = new Date().toISOString();
    const newQuest: Quest = {
      ...questData,
      id: `quest-${generateId()}`,
      status: 'Draft' as QuestStatus,
      stats: { total: 0, approved: 0, rejected: 0, pending: 0 },
      startedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ quests: [newQuest, ...state.quests] }));
    return newQuest;
  },

  updateQuest: (id, updates) => set((state) => ({
    quests: state.quests.map((q) =>
      q.id === id ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q,
    ),
  })),

  deleteQuest: (id) => set((state) => ({
    quests: state.quests.filter((q) => q.id !== id),
    submissions: state.submissions.filter((s) => s.questId !== id),
  })),

  publishQuest: (id) => set((state) => ({
    quests: state.quests.map((q) =>
      q.id === id
        ? { ...q, status: 'Active' as QuestStatus, startedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        : q,
    ),
  })),

  closeQuest: (id) => set((state) => ({
    quests: state.quests.map((q) =>
      q.id === id
        ? { ...q, status: 'Ended' as QuestStatus, updatedAt: new Date().toISOString() }
        : q,
    ),
  })),

  // --- Submission actions ---

  getSubmissionsByQuest: (questId) => get().submissions.filter((s) => s.questId === questId),

  approveSubmission: (id) => set((state) => {
    const submission = state.submissions.find((s) => s.id === id);
    if (!submission || submission.status !== 'Pending') return state;

    const now = new Date().toISOString();
    const updatedSubmissions = state.submissions.map((s) =>
      s.id === id ? { ...s, status: 'Approved' as const, processedAt: now, processedBy: 'admin' } : s,
    );

    const updatedQuests = state.quests.map((q) => {
      if (q.id !== submission.questId) return q;
      return {
        ...q,
        stats: {
          ...q.stats,
          approved: q.stats.approved + 1,
          pending: Math.max(0, q.stats.pending - 1),
        },
        updatedAt: now,
      };
    });

    return { submissions: updatedSubmissions, quests: updatedQuests };
  }),

  rejectSubmission: (id, reason) => set((state) => {
    const submission = state.submissions.find((s) => s.id === id);
    if (!submission || submission.status !== 'Pending') return state;

    const now = new Date().toISOString();
    const updatedSubmissions = state.submissions.map((s) =>
      s.id === id
        ? { ...s, status: 'Rejected' as const, rejectionReason: reason, processedAt: now, processedBy: 'admin' }
        : s,
    );

    const updatedQuests = state.quests.map((q) => {
      if (q.id !== submission.questId) return q;
      return {
        ...q,
        stats: {
          ...q.stats,
          rejected: q.stats.rejected + 1,
          pending: Math.max(0, q.stats.pending - 1),
        },
        updatedAt: now,
      };
    });

    return { submissions: updatedSubmissions, quests: updatedQuests };
  }),

  approveAllPending: (questId) => set((state) => {
    const now = new Date().toISOString();
    let approvedCount = 0;

    const updatedSubmissions = state.submissions.map((s) => {
      if (s.questId === questId && s.status === 'Pending') {
        approvedCount++;
        return { ...s, status: 'Approved' as const, processedAt: now, processedBy: 'admin' };
      }
      return s;
    });

    const updatedQuests = state.quests.map((q) => {
      if (q.id !== questId) return q;
      return {
        ...q,
        stats: {
          ...q.stats,
          approved: q.stats.approved + approvedCount,
          pending: 0,
        },
        updatedAt: now,
      };
    });

    return { submissions: updatedSubmissions, quests: updatedQuests };
  }),

  // --- Rejection reason actions ---

  addRejectionReason: (reasonData) => set((state) => ({
    rejectionReasons: [
      ...state.rejectionReasons,
      {
        ...reasonData,
        id: `reason-${generateId()}`,
        createdAt: new Date().toISOString(),
      },
    ],
  })),

  updateRejectionReason: (id, updates) => set((state) => ({
    rejectionReasons: state.rejectionReasons.map((r) =>
      r.id === id ? { ...r, ...updates } : r,
    ),
  })),

  // --- Raffle actions (Phase 2 stubs) ---

  setRaffleFilters: (filters) => set((state) => ({
    raffleFilters: { ...state.raffleFilters, ...filters },
    rafflePage: 1,
  })),

  resetRaffleFilters: () => set({ raffleFilters: { ...DEFAULT_RAFFLE_FILTERS }, rafflePage: 1 }),

  setRafflePage: (page) => set({ rafflePage: page }),

  getFilteredRaffles: () => {
    const { raffles, raffleFilters } = get();
    let filtered = [...raffles];

    if (raffleFilters.status) {
      filtered = filtered.filter((r) => r.status === raffleFilters.status);
    }

    if (raffleFilters.searchQuery) {
      const query = raffleFilters.searchQuery.toLowerCase();
      filtered = filtered.filter((r) => {
        switch (raffleFilters.searchField) {
          case 'title':
            return r.title.ko.toLowerCase().includes(query) || r.title.en.toLowerCase().includes(query);
          case 'artist':
            return r.artist.toLowerCase().includes(query);
          case 'id':
            return r.id.toLowerCase().includes(query);
          default:
            return r.title.ko.toLowerCase().includes(query);
        }
      });
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return filtered;
  },
}));
