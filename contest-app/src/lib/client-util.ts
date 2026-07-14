// 무로그인 식별용 디바이스 ID(로컬스토리지) + 투표/순위 로컬 기록

const DEVICE_KEY = "cfs_device";
const VOTED_KEY = "cfs_voted";
const RANK_SNAPSHOT_KEY = "cfs_rank_snapshot";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      const rand = () =>
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID().replace(/-/g, "")
          : Math.random().toString(36).slice(2) + Date.now().toString(36);
      id = rand() + rand().slice(0, 8);
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return "device-fallback-00000000";
  }
}

export function getVoted(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(VOTED_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

export function addVoted(entryId: string): void {
  try {
    const s = getVoted();
    s.add(entryId);
    localStorage.setItem(VOTED_KEY, JSON.stringify([...s]));
  } catch {
    /* ignore */
  }
}

// 순위 변동 화살표용: 마지막 열람 시점의 콘테스트별 순위 스냅샷
export function getRankSnapshot(contestId: string): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const all = JSON.parse(localStorage.getItem(RANK_SNAPSHOT_KEY) ?? "{}") as Record<
      string,
      Record<string, number>
    >;
    return all[contestId] ?? {};
  } catch {
    return {};
  }
}

export function saveRankSnapshot(contestId: string, ranks: Record<string, number>): void {
  try {
    const all = JSON.parse(localStorage.getItem(RANK_SNAPSHOT_KEY) ?? "{}") as Record<
      string,
      Record<string, number>
    >;
    all[contestId] = ranks;
    localStorage.setItem(RANK_SNAPSHOT_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}
