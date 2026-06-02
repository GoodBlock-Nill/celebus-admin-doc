import { create } from 'zustand';
import { supportEvents as seed, type SupportEvent, type SupportStatus } from '@/mock/support';

// 세션 메모리 스토어 — 서포트 대시보드·리스트·상세가 공유. 상태 변경(게시·집행·완료·취소·강제 종료)이 화면 간 즉시 반영.
// 새로고침 시 mock 초기값으로 복귀(프로토타입 동작).
interface SupportEventState {
  events: SupportEvent[];
  setStatus: (id: number, status: SupportStatus) => void;
}

export const useSupportEventStore = create<SupportEventState>((set) => ({
  events: seed.map((e) => ({ ...e })),
  setStatus: (id, status) =>
    set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, status } : e)) })),
}));
