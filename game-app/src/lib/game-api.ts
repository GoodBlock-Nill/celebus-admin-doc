// V01D POP — 클라이언트 랭킹 API 헬퍼 (점수 제출 / 내 순위 / 리더보드 읽기)
import { sb } from "./supabase-browser";
import { GAME_CONFIG, defaultAvatar, mergeRemoteConfig, type AvatarDef, type ItemType, type ShopItemType } from "./game-config";

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

// 아바타 값 → 렌더 지시. http URL(업로드 프사) → img / config id에 img 있으면 아이콘 / 그 외 이모지.
export type ResolvedAvatar =
  | { kind: "img"; src: string }
  | { kind: "icon"; src: string; bg: string }
  | { kind: "glyph"; glyph: string; bg: string };

export function resolveAvatar(value: string | null | undefined): ResolvedAvatar {
  if (value && /^https?:\/\//.test(value)) return { kind: "img", src: value };
  const found: AvatarDef = GAME_CONFIG.avatars.find((a) => a.id === value) ?? defaultAvatar();
  if (found.img) return { kind: "icon", src: found.img, bg: found.bg };
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
export type LeaderPeriod = "week" | "month" | "all"; // KST 기준 — 주간=월요일, 월간=1일 초기화
const modeKey = (m: LeaderMode) => (m === "normal" ? "daily" : "free");

// 게임 시작 — 서버가 matchId+seed 발급(점수 위조 방어). 실패 시 null(→ 로컬 시드로 언랭크 플레이).
export async function startMatch(mode: "daily" | "free"): Promise<{ matchId: string; seed: number } | null> {
  try {
    const res = await fetch("/api/scores/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.match_id) return null;
    return { matchId: String(data.match_id), seed: Number(data.seed) };
  } catch {
    return null;
  }
}

// 점수+레벨 제출 → 서버 검증 후 해당 모드 순위 반환. matchId 없으면 랭킹 미등록(null).
export async function submitScore(input: {
  mode: "daily" | "free";
  seed: number;
  score: number;
  level: number;
  matchId: string | null;
  moves?: unknown[]; // 입력 로그(서버 리플레이 검증용, Step 2a 수집)
  nickname: string;
  avatar: string;
}): Promise<RankInfo | null> {
  if (!input.matchId) return null; // 서버 발급 matchId 없이는 랭킹 제출 불가
  try {
    const { matchId, ...rest } = input;
    const res = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...rest, match_id: matchId }),
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

export async function fetchMyRank(period: LeaderPeriod = "all"): Promise<MyRank | null> {
  try {
    const res = await fetch(`/api/scores/my-rank?period=${period}`);
    return (await res.json()) as MyRank;
  } catch {
    return null;
  }
}

// 멤버 표시 이름(다국어) — 닉네임 옆에 병기. 미설정 시 null.
export type MemberName = { ko: string; en: string; ja: string } | null;
export type LeaderRow = { rank: number; nickname: string; score: number; level: number; avatar: string | null; member?: boolean; member_name?: MemberName };

// V01D 멤버 보드 — 멤버별 주간·월간 성적(전체 보드 내 순위)
export type MemberStat = { rank: number; level: number; score: number } | null;
export type MemberRow = { nickname: string; avatar: string | null; member_name?: MemberName; week: MemberStat; month: MemberStat };

export async function fetchMemberBoard(mode: LeaderMode): Promise<MemberRow[]> {
  const { data, error } = await sb.rpc("game_member_board", { p_mode: modeKey(mode) });
  if (error || !data) return [];
  return data as MemberRow[];
}

export async function fetchLeaderboard(mode: LeaderMode, period: LeaderPeriod = "all"): Promise<LeaderRow[]> {
  const { data, error } = await sb.rpc("game_leaderboard_period", {
    p_mode: modeKey(mode),
    p_period: period,
    p_limit: 100,
  });
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
export type Inventory = Partial<Record<ShopItemType, number>>;
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

export async function buyItem(itemType: ShopItemType, qty = 1): Promise<BuyResult> {
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

// ── 주간 랭킹 보상 (lazy claim — 새 주 첫 접속 시 1회) — CP + 가챠 이용권 동시 수령 ──
export type WeeklyTickets = {
  has_result: boolean;
  tickets?: Partial<Record<"normal" | "item", { rank: number; tickets: number; paid: boolean }>>;
  total_tickets?: number;
  free_tickets?: number;
  paid_tickets?: number;
};

export type WeeklyReward = {
  has_result: boolean;
  week_start?: string;
  rewards?: Partial<Record<"normal" | "item", { rank: number; cp: number; paid: boolean }>>;
  total_cp?: number;
  celeb_point?: number;
  gacha?: WeeklyTickets;
};

export async function claimWeeklyReward(): Promise<WeeklyReward | null> {
  try {
    const res = await fetch("/api/rewards/weekly", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    if (!res.ok) return null; // 서버 실패 = 미확인 처리 — 다음 접속에 재시도 (성공 응답만 seen 기록)
    return (await res.json()) as WeeklyReward;
  } catch {
    return null;
  }
}

// ── 가챠 이용권 지갑 (무상 = 랭킹 보상 → 실물+재화 가챠 / 유상 = CP 구매 → 재화 가챠 전용) ──
export type GachaWallet = { free_tickets: number; paid_tickets: number };

export async function fetchGachaWallet(): Promise<GachaWallet> {
  try {
    const res = await fetch("/api/gacha/status");
    const data = await res.json();
    return { free_tickets: data?.free_tickets ?? 0, paid_tickets: data?.paid_tickets ?? 0 };
  } catch {
    return { free_tickets: 0, paid_tickets: 0 };
  }
}

// ── 가챠 이벤트·뽑기 (Phase 3: 재화 확률형) ──
export type L10nText = { ko?: string; en?: string; ja?: string };
export type GachaGrade = "S" | "A" | "B" | "C" | "D";
export type GachaReward = { cp?: number; item?: string; qty?: number } | null;
export type GachaPoolItem = {
  grade: GachaGrade;
  prize: L10nText;
  image_url: string | null;
  is_physical: boolean;
  weight: number | null;
  total_qty: number | null;
  remaining_qty: number | null;
  reward_payload: GachaReward;
  sort: number;
};
export type GachaEvent = {
  id: string;
  kind: "digital" | "physical_box";
  title: L10nText;
  description: L10nText;
  image_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  pool: GachaPoolItem[];
};
export type GachaStatus = GachaWallet & { events: GachaEvent[] };

export async function fetchGachaStatus(): Promise<GachaStatus> {
  try {
    const res = await fetch("/api/gacha/status");
    const data = await res.json();
    return {
      free_tickets: data?.free_tickets ?? 0,
      paid_tickets: data?.paid_tickets ?? 0,
      events: Array.isArray(data?.events) ? data.events : [],
    };
  } catch {
    return { free_tickets: 0, paid_tickets: 0, events: [] };
  }
}

export type GachaDrawCard = { draw_id: string; grade: GachaGrade; prize: L10nText; image_url: string | null; reward: GachaReward };
export type GachaDrawResponse =
  | { ok: true; results: GachaDrawCard[]; bonus_ticket: boolean; celeb_point: number; wallet: GachaWallet }
  | { ok: false; reason: string };

export async function drawGacha(eventId: string, count: 1 | 10): Promise<GachaDrawResponse> {
  try {
    const res = await fetch("/api/gacha/draw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: eventId, count }),
    });
    const data = await res.json();
    if (data?.status === "ok") {
      return {
        ok: true,
        results: data.results ?? [],
        bonus_ticket: !!data.bonus_ticket,
        celeb_point: data.celeb_point ?? 0,
        wallet: { free_tickets: data.free_tickets ?? 0, paid_tickets: data.paid_tickets ?? 0 },
      };
    }
    return { ok: false, reason: data?.reason ?? "error" };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export type BuyTicketResult = { ok: true; celeb_point: number; wallet: GachaWallet } | { ok: false; reason: string };

export async function buyGachaTicket(qty = 1): Promise<BuyTicketResult> {
  try {
    const res = await fetch("/api/gacha/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qty }),
    });
    const data = await res.json();
    if (data?.status === "ok") {
      return { ok: true, celeb_point: data.celeb_point ?? 0, wallet: { free_tickets: data.free_tickets ?? 0, paid_tickets: data.paid_tickets ?? 0 } };
    }
    return { ok: false, reason: data?.reason ?? "error" };
  } catch {
    return { ok: false, reason: "error" };
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
export async function fetchCatalog(): Promise<Partial<Record<ShopItemType, number>>> {
  try {
    const { data, error } = await sb.from("game_catalog_public").select("item_type, price");
    if (error || !data) return {};
    const map: Partial<Record<ShopItemType, number>> = {};
    for (const r of data as { item_type: ShopItemType; price: number }[]) map[r.item_type] = r.price;
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
