// V01D POP — 클라이언트 랭킹 API 헬퍼 (점수 제출 / 내 순위 / 리더보드 읽기)
import { sb } from "./supabase-browser";
import { GAME_CONFIG, defaultAvatar, mergeRemoteConfig, type AvatarDef, type ItemType } from "./game-config";

const NICK_KEY = "cfg_nick";
const AVATAR_KEY = "cfg_avatar";

export function getNick(): string {
  try {
    return localStorage.getItem(NICK_KEY) || "";
  } catch {
    return "";
  }
}

export function setNick(v: string): void {
  try {
    localStorage.setItem(NICK_KEY, v.trim().slice(0, 16));
  } catch {
    /* ignore */
  }
}

// ── 게임설정 플래그 (기본 true) ──
function getFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) !== "0";
  } catch {
    return true;
  }
}
function setFlag(key: string, on: boolean): void {
  try {
    localStorage.setItem(key, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export const getHaptics = () => getFlag("cfg_haptics");
export const setHaptics = (on: boolean) => setFlag("cfg_haptics", on);

// 튜토리얼 강제 표시 설정 — 기본 OFF(매판 강제 아님). ON이면 매 게임 인트로 표시.
export function getOnboarding(): boolean {
  try {
    return localStorage.getItem("cfg_onboarding") === "1";
  } catch {
    return false;
  }
}
export const setOnboarding = (on: boolean) => setFlag("cfg_onboarding", on);

// 최초 1회 인트로 노출 여부 — 처음 플레이 시 자동 표시 후 다시 안 뜸.
export const getSeenIntro = () => {
  try {
    return localStorage.getItem("cfg_seen_intro") === "1";
  } catch {
    return false;
  }
};
export const setSeenIntro = () => {
  try {
    localStorage.setItem("cfg_seen_intro", "1");
  } catch {
    /* ignore */
  }
};

// 햅틱 진동 (설정 on + 지원 기기에서만)
export function vibrate(ms: number): void {
  try {
    if (getHaptics() && typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(ms);
  } catch {
    /* ignore */
  }
}

// ── 테마 강조색 (사용자 오버라이드) ──
const THEME_KEY = "cfg_theme";

export function getThemePrimary(): string | null {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

export function applyAccent(hex: string): void {
  const r = document.documentElement.style;
  r.setProperty("--color-primary", hex);
  r.setProperty("--color-primary-400", hex);
  r.setProperty("--color-primary-600", hex);
  r.setProperty("--color-primary-strong", hex);
}

export function setThemePrimary(hex: string): void {
  try {
    localStorage.setItem(THEME_KEY, hex);
  } catch {
    /* ignore */
  }
  applyAccent(hex);
}

export function getAvatar(): string {
  try {
    return localStorage.getItem(AVATAR_KEY) || defaultAvatar().id;
  } catch {
    return defaultAvatar().id;
  }
}

export function setAvatar(id: string): void {
  try {
    localStorage.setItem(AVATAR_KEY, id);
  } catch {
    /* ignore */
  }
}

// 아바타 값 → 렌더 지시. http URL(미래 소셜 프사) → img, 그 외 → config id 조회, 미해석 → 기본.
export type ResolvedAvatar = { kind: "img"; src: string } | { kind: "glyph"; glyph: string; bg: string };

export function resolveAvatar(value: string | null | undefined): ResolvedAvatar {
  if (value && /^https?:\/\//.test(value)) return { kind: "img", src: value };
  const found: AvatarDef = GAME_CONFIG.avatars.find((a) => a.id === value) ?? defaultAvatar();
  return { kind: "glyph", glyph: found.glyph, bg: found.bg };
}

// 제출한 모드의 순위(모드별 전체 랭킹, (최고레벨, 점수) 기준)
export type RankInfo = {
  rank: number | null;
  total: number | null;
  best_level?: number | null;
  best_score?: number | null;
};

// 리더보드 모드 키 매핑: UI normal/item ↔ 내부 daily/free
export type LeaderMode = "normal" | "item";
const modeKey = (m: LeaderMode) => (m === "normal" ? "daily" : "free");

// 점수+레벨 제출 → 서버 검증 후 해당 모드 순위 반환. 실패 시 null.
export async function submitScore(input: {
  mode: "daily" | "free";
  seed: number;
  score: number;
  level: number;
  nickname: string;
  avatar: string;
}): Promise<RankInfo | null> {
  try {
    const res = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (data?.status !== "ok") return null;
    return data as RankInfo;
  } catch {
    return null;
  }
}

// 모드별 내 순위 (일반/아이템)
export type MyRank = {
  normal_rank: number | null;
  normal_total: number | null;
  normal_best_level: number | null;
  item_rank: number | null;
  item_total: number | null;
  item_best_level: number | null;
};

export async function fetchMyRank(): Promise<MyRank | null> {
  try {
    const res = await fetch("/api/scores/my-rank");
    return (await res.json()) as MyRank;
  } catch {
    return null;
  }
}

export type LeaderRow = { rank: number; nickname: string; score: number; level: number; avatar: string | null };

export async function fetchLeaderboard(mode: LeaderMode): Promise<LeaderRow[]> {
  const view = mode === "normal" ? "game_leaderboard_normal" : "game_leaderboard_item";
  const { data, error } = await sb.from(view).select("rank, avatar, nickname, level, score").order("rank");
  if (error || !data) return [];
  return data as LeaderRow[];
}

export { modeKey };

// 상위 % (1위 = 상위 1%로 표기, 반올림, 최소 1)
export function topPercent(rank: number, total: number): number {
  if (!total || total <= 0) return 100;
  return Math.max(1, Math.round((rank / total) * 100));
}

// ── CELEB Point 지갑 / 아이템 인벤토리 (서버 권위) ──
export type Inventory = Partial<Record<ItemType, number>>;
export type Account = { celeb_point: number; inventory: Inventory };

const EMPTY_ACCOUNT: Account = { celeb_point: 0, inventory: {} };

export async function fetchAccount(): Promise<Account> {
  try {
    const res = await fetch("/api/account");
    const data = await res.json();
    return { celeb_point: data?.celeb_point ?? 0, inventory: data?.inventory ?? {} };
  } catch {
    return EMPTY_ACCOUNT;
  }
}

// 파일럿 테스트 충전 → 새 잔액 또는 null(실패)
export async function chargePoint(amount: number): Promise<number | null> {
  try {
    const res = await fetch("/api/account/charge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    return data?.status === "ok" ? (data.celeb_point as number) : null;
  } catch {
    return null;
  }
}

export type BuyResult = { ok: true; account: Account } | { ok: false; reason: string };

export async function buyItem(itemType: ItemType, qty = 1): Promise<BuyResult> {
  try {
    const res = await fetch("/api/shop/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_type: itemType, qty }),
    });
    const data = await res.json();
    if (data?.status === "ok") return { ok: true, account: { celeb_point: data.celeb_point ?? 0, inventory: data.inventory ?? {} } };
    return { ok: false, reason: data?.reason ?? "error" };
  } catch {
    return { ok: false, reason: "error" };
  }
}

// ── 데일리 출석 보상 ──
export type DailyStatus = { claimable: boolean; streak: number; next_reward: number | null };
export type ClaimResult = { claimed: boolean; reward?: number; streak?: number; celeb_point?: number };

export async function getDailyStatus(): Promise<DailyStatus> {
  try {
    const res = await fetch("/api/daily");
    const data = await res.json();
    return { claimable: !!data?.claimable, streak: data?.streak ?? 0, next_reward: data?.next_reward ?? null };
  } catch {
    return { claimable: false, streak: 0, next_reward: null };
  }
}

export async function claimDaily(): Promise<ClaimResult | null> {
  try {
    const res = await fetch("/api/daily/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const data = await res.json();
    if (data?.status !== "ok") return null;
    return data as ClaimResult;
  } catch {
    return null;
  }
}

// 서버 config 오버라이드를 GAME_CONFIG에 병합(부트 시 1회). 실패해도 조용히 기본값 사용.
export async function fetchRemoteConfig(): Promise<void> {
  try {
    const { data, error } = await sb.from("game_config_public").select("config").limit(1).maybeSingle();
    if (!error && data?.config) mergeRemoteConfig(data.config);
  } catch {
    /* 네트워크 실패 → 코드 기본값 유지 */
  }
}

// 상점 가격 권위 소스 — 카탈로그(item_type→price). 실패 시 빈 맵(호출측 config 폴백).
export async function fetchCatalog(): Promise<Partial<Record<ItemType, number>>> {
  try {
    const { data, error } = await sb.from("game_catalog_public").select("item_type, price");
    if (error || !data) return {};
    const map: Partial<Record<ItemType, number>> = {};
    for (const r of data as { item_type: ItemType; price: number }[]) map[r.item_type] = r.price;
    return map;
  } catch {
    return {};
  }
}

// 자유 플레이 종료 시 사용 아이템 차감 → 갱신 인벤토리(실패 시 null)
export async function consumeItems(used: Inventory): Promise<Inventory | null> {
  try {
    const res = await fetch("/api/inventory/consume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ used }),
    });
    const data = await res.json();
    return data?.status === "ok" ? (data.inventory as Inventory) : null;
  } catch {
    return null;
  }
}
