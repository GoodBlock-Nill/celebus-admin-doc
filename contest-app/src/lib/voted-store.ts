// 투표 상태 스토어 — 서버(쿠키 신원) 투표 여부를 localStorage(cfs_voted)와 합쳐 단일 진실로.
// 보안 수정으로 dedup 신원이 서버 쿠키로 바뀌면서, 클라 localStorage와 어긋나면
// "눌렀는데 카운트 안 오름"이 발생 → 서버 기준을 합집합으로 반영해 방지.
import { getVoted } from "./client-util";

const server = new Set<string>();
const listeners = new Set<() => void>();

export function isVoted(entryId: string): boolean {
  return server.has(entryId) || getVoted().has(entryId);
}

export function subscribeVoted(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function markVoted(entryId: string): void {
  if (!server.has(entryId)) {
    server.add(entryId);
    listeners.forEach((l) => l());
  }
}

// 보이는 출품작들의 서버 투표 여부 동기화
export async function syncVotedStatus(ids: string[]): Promise<void> {
  const uniq = [...new Set(ids)].filter(Boolean);
  if (!uniq.length) return;
  try {
    const res = await fetch("/api/entries/voted-status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: uniq }),
    });
    const data = await res.json();
    if (Array.isArray(data.voted) && data.voted.length) {
      let changed = false;
      for (const id of data.voted)
        if (!server.has(id)) {
          server.add(id);
          changed = true;
        }
      if (changed) listeners.forEach((l) => l());
    }
  } catch {
    /* 실패 시 localStorage 기준 유지 */
  }
}
