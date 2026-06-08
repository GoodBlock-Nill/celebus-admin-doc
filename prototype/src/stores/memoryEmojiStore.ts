import { create } from 'zustand';
import {
  libraryEmojis as libSeed,
  emojiLinks as linkSeed,
  type LibraryEmoji,
  type EmojiLink,
} from '@/mock/memoryEmoji';

// 기억저장소 감정 이모지 스토어
// - library: 전역 라이브러리 (즉시 반영, draft/applied 없음)
// - linksApplied/linksDraft: 아티스트별 연결 (draft 편집 → apply로 게시)
// 새로고침 시 mock 초기값 복귀 (non-persist).

export interface LibraryEmojiInput {
  imageSrc: string;
  labelKO: string;
  labelEN: string;
  labelJA: string;
}

export interface LinkedItem {
  link: EmojiLink;
  emoji: LibraryEmoji;
}

const pad = (n: number) => String(n).padStart(2, '0');
function nowStamp(): string {
  const d = new Date();
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// draft vs applied 비교: 신규 연결·해제·order·active 변경 건수
function calcPending(draft: EmojiLink[], applied: EmojiLink[], artistGroupId: number): number {
  const a = applied.filter((l) => l.artistGroupId === artistGroupId);
  const d = draft.filter((l) => l.artistGroupId === artistGroupId);
  const aById = new Map(a.map((l) => [l.id, l]));
  const dById = new Map(d.map((l) => [l.id, l]));
  let n = 0;
  for (const l of d) {
    const prev = aById.get(l.id);
    if (!prev) { n++; continue; } // 신규 연결
    if (prev.order !== l.order || prev.active !== l.active) n++;
  }
  for (const l of a) {
    if (!dById.has(l.id)) n++; // 연결 해제됨
  }
  return n;
}

interface MemoryEmojiState {
  library: LibraryEmoji[];
  linksApplied: EmojiLink[];
  linksDraft: EmojiLink[];
  lastAppliedAt: Record<number, string>;

  // ── 라이브러리 액션 (전역 즉시 반영) ──────────────────────────────────────
  addLibraryEmoji: (input: LibraryEmojiInput) => void;
  updateLibraryEmoji: (id: number, input: LibraryEmojiInput) => void;
  /** 연결 아티스트 0 && !memberUsed 일 때만 삭제. 조건 미충족 시 무시. */
  deleteLibraryEmoji: (id: number) => void;

  // ── 연결 액션 (linksDraft 대상) ───────────────────────────────────────────
  /** 이미 연결된 것 제외, 마지막 order 뒤에 active:false로 추가, 40 상한 내 */
  linkEmojis: (artistGroupId: number, emojiIds: number[]) => void;
  unlink: (linkId: number) => void;
  moveLink: (linkId: number, dir: 'up' | 'down') => void;
  /** 미사용→사용은 사용 6 여유일 때만. 반환값: 토글 성공 여부 */
  toggleActive: (linkId: number) => boolean;
  applyLinks: (artistGroupId: number) => void;
  revertLinks: (artistGroupId: number) => void;

  // ── 셀렉터 ────────────────────────────────────────────────────────────────
  /** linksDraft를 library와 조인해 order 오름차순으로 반환 */
  linkedSetOf: (artistGroupId: number) => LinkedItem[];
  /** 그 이모지를 연결한 distinct artistGroup 수 (linksDraft 기준) */
  linkedArtistCount: (emojiId: number) => number;
  pendingCount: (artistGroupId: number) => number;
}

export const useMemoryEmojiStore = create<MemoryEmojiState>((set, get) => ({
  library: libSeed.map((e) => ({ ...e })),
  linksApplied: linkSeed.map((l) => ({ ...l })),
  linksDraft: linkSeed.map((l) => ({ ...l })),
  lastAppliedAt: { 1: '2026.06.01 10:00', 2: '2026.06.01 10:00' },

  // ── 라이브러리 액션 ──────────────────────────────────────────────────────
  addLibraryEmoji: (input) =>
    set((s) => {
      const nextId = Math.max(0, ...s.library.map((e) => e.id)) + 1;
      const created: LibraryEmoji = {
        id: nextId,
        imageSrc: input.imageSrc,
        labelKO: input.labelKO,
        labelEN: input.labelEN,
        labelJA: input.labelJA,
        isPreset: false,
        memberUsed: false,
      };
      return { library: [...s.library, created] };
    }),

  updateLibraryEmoji: (id, input) =>
    set((s) => ({
      library: s.library.map((e) =>
        e.id === id
          ? { ...e, imageSrc: input.imageSrc, labelKO: input.labelKO, labelEN: input.labelEN, labelJA: input.labelJA }
          : e,
      ),
    })),

  deleteLibraryEmoji: (id) =>
    set((s) => {
      const emoji = s.library.find((e) => e.id === id);
      if (!emoji) return {};
      if (emoji.memberUsed) return {};
      const isLinked = s.linksDraft.some((l) => l.emojiId === id);
      if (isLinked) return {};
      return { library: s.library.filter((e) => e.id !== id) };
    }),

  // ── 연결 액션 ────────────────────────────────────────────────────────────
  linkEmojis: (artistGroupId, emojiIds) =>
    set((s) => {
      const existing = s.linksDraft.filter((l) => l.artistGroupId === artistGroupId);
      const existingEmojiIds = new Set(existing.map((l) => l.emojiId));
      const newIds = emojiIds.filter((id) => !existingEmojiIds.has(id));
      const capacity = 40 - existing.length;
      const toAdd = newIds.slice(0, capacity);
      if (toAdd.length === 0) return {};
      const maxOrder = existing.reduce((mx, l) => Math.max(mx, l.order), 0);
      const maxLinkId = Math.max(0, ...s.linksDraft.map((l) => l.id), ...s.linksApplied.map((l) => l.id));
      const newLinks: EmojiLink[] = toAdd.map((emojiId, i) => ({
        id: maxLinkId + 1 + i,
        artistGroupId,
        emojiId,
        order: maxOrder + 1 + i,
        active: false,
      }));
      return { linksDraft: [...s.linksDraft, ...newLinks] };
    }),

  unlink: (linkId) =>
    set((s) => ({ linksDraft: s.linksDraft.filter((l) => l.id !== linkId) })),

  moveLink: (linkId, dir) =>
    set((s) => {
      const target = s.linksDraft.find((l) => l.id === linkId);
      if (!target) return {};
      const siblings = s.linksDraft
        .filter((l) => l.artistGroupId === target.artistGroupId)
        .sort((a, b) => a.order - b.order);
      const idx = siblings.findIndex((l) => l.id === linkId);
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= siblings.length) return {};
      const a = siblings[idx];
      const b = siblings[swapIdx];
      return {
        linksDraft: s.linksDraft.map((l) => {
          if (l.id === a.id) return { ...l, order: b.order };
          if (l.id === b.id) return { ...l, order: a.order };
          return l;
        }),
      };
    }),

  toggleActive: (linkId) => {
    const s = get();
    const link = s.linksDraft.find((l) => l.id === linkId);
    if (!link) return false;
    if (!link.active) {
      // 미사용 → 사용 시도: 사용 상한 확인
      const activeCount = s.linksDraft.filter(
        (l) => l.artistGroupId === link.artistGroupId && l.active,
      ).length;
      if (activeCount >= 6) return false;
    }
    const next = !link.active;
    set((st) => ({
      linksDraft: st.linksDraft.map((l) => (l.id === linkId ? { ...l, active: next } : l)),
    }));
    return true;
  },

  applyLinks: (artistGroupId) =>
    set((s) => ({
      linksApplied: [
        ...s.linksApplied.filter((l) => l.artistGroupId !== artistGroupId),
        ...s.linksDraft.filter((l) => l.artistGroupId === artistGroupId).map((l) => ({ ...l })),
      ],
      lastAppliedAt: { ...s.lastAppliedAt, [artistGroupId]: nowStamp() },
    })),

  revertLinks: (artistGroupId) =>
    set((s) => ({
      linksDraft: [
        ...s.linksDraft.filter((l) => l.artistGroupId !== artistGroupId),
        ...s.linksApplied.filter((l) => l.artistGroupId === artistGroupId).map((l) => ({ ...l })),
      ],
    })),

  // ── 셀렉터 ──────────────────────────────────────────────────────────────
  linkedSetOf: (artistGroupId) => {
    const s = get();
    const libMap = new Map(s.library.map((e) => [e.id, e]));
    return s.linksDraft
      .filter((l) => l.artistGroupId === artistGroupId)
      .sort((a, b) => a.order - b.order)
      .flatMap((l) => {
        const emoji = libMap.get(l.emojiId);
        if (!emoji) return [];
        return [{ link: l, emoji }];
      });
  },

  linkedArtistCount: (emojiId) => {
    const s = get();
    const groups = new Set(s.linksDraft.filter((l) => l.emojiId === emojiId).map((l) => l.artistGroupId));
    return groups.size;
  },

  pendingCount: (artistGroupId) =>
    calcPending(get().linksDraft, get().linksApplied, artistGroupId),
}));
