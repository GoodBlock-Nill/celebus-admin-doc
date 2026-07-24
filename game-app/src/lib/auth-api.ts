// 가입/로그인/프로필 클라이언트 API — 서버 신원 쿠키(httpOnly) 기반
export type Profile = {
  signed_up: boolean;
  nickname?: string;
  avatar?: string | null;
  phone_cc?: string;
  phone_last4?: string;
  offline?: boolean; // 네트워크/서버 실패로 판정 불가(미가입과 구분)
};

export type AuthResult = { ok: true; nickname: string; avatar: string | null } | { ok: false; reason: string };

const SIGNED_KEY = "cfg_signed"; // 오프라인 부팅 시 게이트 통과 힌트(서버 판정 실패 시에만 사용)

export function hasLocalSession(): boolean {
  try {
    return localStorage.getItem(SIGNED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markLocalSession(on: boolean): void {
  try {
    if (on) localStorage.setItem(SIGNED_KEY, "1");
    else localStorage.removeItem(SIGNED_KEY);
  } catch {
    /* ignore */
  }
}

async function post(path: string, body: unknown): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function fetchProfile(): Promise<Profile> {
  try {
    // 8초 상한 — 불안정 네트워크에서 스플래시 고착 방지
    const res = await fetch("/api/auth/me", { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error("bad_status");
    const data = (await res.json()) as Profile;
    return { ...data, signed_up: !!data?.signed_up };
  } catch {
    return { signed_up: false, offline: true };
  }
}

export async function signup(input: {
  nickname: string;
  phone_cc: string;
  phone: string;
  password: string;
  avatar: string;
}): Promise<AuthResult> {
  const data = await post("/api/auth/signup", input);
  if (data?.status === "ok") {
    markLocalSession(true);
    return { ok: true, nickname: String(data.nickname), avatar: (data.avatar as string) ?? null };
  }
  return { ok: false, reason: String(data?.reason ?? "error") };
}

export async function login(input: { nickname: string; password: string }): Promise<AuthResult> {
  const data = await post("/api/auth/login", input);
  if (data?.status === "ok") {
    markLocalSession(true);
    // 이 기기의 이전 계정 최고점 잔존 방지 — 서버 best는 다음 제출 응답에서 재동기화
    try {
      localStorage.removeItem("cfg_best_daily");
      localStorage.removeItem("cfg_best_free");
    } catch {
      /* ignore */
    }
    return { ok: true, nickname: String(data.nickname), avatar: (data.avatar as string) ?? null };
  }
  return { ok: false, reason: String(data?.reason ?? "error") };
}

// 아바타 변경 — 기본 아바타 id 또는 업로드 이미지(dataURL). 성공 시 저장된 아바타 값(id 또는 URL) 반환.
export async function saveAvatar(input: { avatar?: string; image?: string }): Promise<string | null> {
  const data = await post("/api/auth/avatar", input);
  return data?.status === "ok" ? String(data.avatar) : null;
}

// 로그아웃 — 쿠키 제거 + 이 기기의 계정 표시값·세션 힌트 정리
export async function logout(): Promise<boolean> {
  const data = await post("/api/auth/logout", {});
  if (data?.status !== "ok") return false;
  markLocalSession(false);
  try {
    localStorage.removeItem("cfg_nick");
    localStorage.removeItem("cfg_avatar");
    localStorage.removeItem("cfg_best_daily");
    localStorage.removeItem("cfg_best_free");
  } catch {
    /* ignore */
  }
  return true;
}
