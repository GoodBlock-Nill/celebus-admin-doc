import { create } from 'zustand';
import { emotionEmojis as seed, type EmotionEmoji } from '@/mock/memoryEmoji';

// 세션 메모리 스토어 — 감정 이모지 관리 화면.
// 이중 상태: draft(BO 작업본) / applied(앱 반영본). 편집은 draft만 수정하고,
// [변경사항 적용] 시에만 draft → applied 게시(앱 반영). 적용 전까지 앱은 직전 적용본 유지.
// 새로고침 시 mock 초기값으로 복귀(프로토타입 동작).

export type EmojiInput = {
  emoji: string; // 유니코드 이모지 (이미지 방식이면 빈 문자열)
  imageSrc?: string; // 커스텀 이미지 파일명 (있으면 이미지 방식)
  labelKO: string;
  labelEN: string;
  labelJA: string;
  active: boolean;
};

// 동일 항목 변경 여부(필드·순서 포함)
function isChanged(a: EmotionEmoji, b: EmotionEmoji): boolean {
  return (
    a.emoji !== b.emoji ||
    (a.imageSrc ?? '') !== (b.imageSrc ?? '') ||
    a.labelKO !== b.labelKO ||
    a.labelEN !== b.labelEN ||
    a.labelJA !== b.labelJA ||
    a.active !== b.active ||
    a.order !== b.order
  );
}

const pad = (n: number) => String(n).padStart(2, '0');
function nowStamp(): string {
  const d = new Date();
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface MemoryEmojiState {
  applied: EmotionEmoji[]; // 앱 반영본
  draft: EmotionEmoji[]; // BO 작업본
  lastAppliedAt: Record<number, string>;
  /** 작업본(draft) 세트 — order 오름차순 */
  setOf: (artistGroupId: number) => EmotionEmoji[];
  /** 미적용 변경 건수 (draft vs applied) */
  pendingCount: (artistGroupId: number) => number;
  add: (artistGroupId: number, data: EmojiInput) => void;
  update: (id: number, data: EmojiInput) => void;
  remove: (id: number) => void;
  move: (id: number, dir: 'up' | 'down') => void;
  toggleActive: (id: number) => boolean; // 변경 후 값 반환 (토스트 문구용)
  apply: (artistGroupId: number) => void; // draft → applied 게시
  revert: (artistGroupId: number) => void; // draft ← applied 복원
}

export const useMemoryEmojiStore = create<MemoryEmojiState>((set, get) => ({
  applied: seed.map((e) => ({ ...e })),
  draft: seed.map((e) => ({ ...e })),
  lastAppliedAt: { 1: '2026.06.01 10:00', 2: '2026.06.01 10:00' },

  setOf: (artistGroupId) =>
    get()
      .draft.filter((e) => e.artistGroupId === artistGroupId)
      .sort((a, b) => a.order - b.order),

  pendingCount: (artistGroupId) => {
    const a = get().applied.filter((e) => e.artistGroupId === artistGroupId);
    const d = get().draft.filter((e) => e.artistGroupId === artistGroupId);
    const aById = new Map(a.map((e) => [e.id, e]));
    const dById = new Map(d.map((e) => [e.id, e]));
    let n = 0;
    for (const e of d) {
      const prev = aById.get(e.id);
      if (!prev || isChanged(prev, e)) n++;
    }
    for (const e of a) if (!dById.has(e.id)) n++; // 삭제됨
    return n;
  },

  add: (artistGroupId, data) =>
    set((s) => {
      const maxOrder = s.draft
        .filter((e) => e.artistGroupId === artistGroupId)
        .reduce((mx, e) => Math.max(mx, e.order), 0);
      const nextId =
        Math.max(0, ...s.draft.map((e) => e.id), ...s.applied.map((e) => e.id)) + 1;
      const created: EmotionEmoji = {
        id: nextId,
        artistGroupId,
        emoji: data.emoji,
        imageSrc: data.imageSrc,
        labelKO: data.labelKO,
        labelEN: data.labelEN,
        labelJA: data.labelJA,
        order: maxOrder + 1,
        active: data.active,
        inUse: false,
      };
      return { draft: [...s.draft, created] };
    }),

  update: (id, data) =>
    set((s) => ({
      draft: s.draft.map((e) =>
        e.id === id
          ? {
              ...e,
              emoji: data.emoji,
              imageSrc: data.imageSrc,
              labelKO: data.labelKO,
              labelEN: data.labelEN,
              labelJA: data.labelJA,
              active: data.active,
            }
          : e,
      ),
    })),

  remove: (id) => set((s) => ({ draft: s.draft.filter((e) => e.id !== id) })),

  move: (id, dir) =>
    set((s) => {
      const target = s.draft.find((e) => e.id === id);
      if (!target) return {};
      const siblings = s.draft
        .filter((e) => e.artistGroupId === target.artistGroupId)
        .sort((a, b) => a.order - b.order);
      const idx = siblings.findIndex((e) => e.id === id);
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= siblings.length) return {};
      const a = siblings[idx];
      const b = siblings[swapIdx];
      return {
        draft: s.draft.map((e) => {
          if (e.id === a.id) return { ...e, order: b.order };
          if (e.id === b.id) return { ...e, order: a.order };
          return e;
        }),
      };
    }),

  toggleActive: (id) => {
    const next = !(get().draft.find((e) => e.id === id)?.active ?? true);
    set((s) => ({ draft: s.draft.map((e) => (e.id === id ? { ...e, active: next } : e)) }));
    return next;
  },

  apply: (artistGroupId) =>
    set((s) => ({
      applied: [
        ...s.applied.filter((e) => e.artistGroupId !== artistGroupId),
        ...s.draft.filter((e) => e.artistGroupId === artistGroupId).map((e) => ({ ...e })),
      ],
      lastAppliedAt: { ...s.lastAppliedAt, [artistGroupId]: nowStamp() },
    })),

  revert: (artistGroupId) =>
    set((s) => ({
      draft: [
        ...s.draft.filter((e) => e.artistGroupId !== artistGroupId),
        ...s.applied.filter((e) => e.artistGroupId === artistGroupId).map((e) => ({ ...e })),
      ],
    })),
}));
