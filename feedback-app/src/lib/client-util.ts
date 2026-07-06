// 무로그인 식별용 디바이스 ID(로컬스토리지) + 좋아요 로컬 기록

const DEVICE_KEY = "cfb_device";
const LIKED_KEY = "cfb_liked";

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

export function getLiked(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(LIKED_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

export function addLiked(id: string): void {
  try {
    const s = getLiked();
    s.add(id);
    localStorage.setItem(LIKED_KEY, JSON.stringify([...s]));
  } catch {
    /* ignore */
  }
}
