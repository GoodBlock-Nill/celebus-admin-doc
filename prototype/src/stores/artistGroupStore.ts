import { create } from 'zustand';
import { artistGroups as seed, type ArtistGroup, type ArtistStatus } from '@/mock/artists';

// 세션 메모리 스토어 — 그룹 리스트·상세가 공유. 토글·상태 변경이 화면 간 즉시 반영.
// 새로고침 시 mock 초기값으로 복귀(프로토타입 동작).
interface ArtistGroupState {
  groups: ArtistGroup[];
  toggleExposure: (id: number) => boolean; // 변경 후 값 반환 (토스트 문구용)
  setStatus: (id: number, status: ArtistStatus) => void;
}

export const useArtistGroupStore = create<ArtistGroupState>((set, get) => ({
  groups: seed.map((g) => ({ ...g, exploreExposed: g.exploreExposed ?? true })),
  toggleExposure: (id) => {
    const next = !(get().groups.find((g) => g.id === id)?.exploreExposed ?? true);
    set((s) => ({ groups: s.groups.map((g) => (g.id === id ? { ...g, exploreExposed: next } : g)) }));
    return next;
  },
  setStatus: (id, status) =>
    set((s) => ({ groups: s.groups.map((g) => (g.id === id ? { ...g, status } : g)) })),
}));
