// CELEBUS SSO 세션 클라이언트 API — 본앱 로그인 상태를 서버가 검증해 게임 세션을 발급한다.
// 자체 가입/로그인/로그아웃은 폐기(2026-07-24 SSO 전환). 세션 수명은 본앱이 관리.
export type Profile = {
  signed_up: boolean;
  nickname?: string;
  avatar?: string | null;
  is_member?: boolean;
  offline?: boolean; // 네트워크/서버 실패로 판정 불가(미로그인과 구분)
  bridge?: boolean; // 본앱 로그인은 확인됐으나 게임 세션 발급 실패(연동 문제)
};

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

// CELEBUS 본앱 users/me — 인증 쿠키가 api 호스트 전용(HttpOnly)이라
// "브라우저 → 본앱 API 직접 호출"만 세션 확인이 가능하다 (개발팀 확정 방식, 2026-07-24).
const CELEBUS_ME_URL = "https://api.client.celebus.xyz/v1/private/users/me";

type CelebusMe = { uid: string; nickname: string; avatar: string };

// 실측 스키마(data: userId·username·profileImageUrl) 우선 + 방어적 후보
function pickField(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return "";
}
function extractUser(body: unknown): CelebusMe | null {
  if (!body || typeof body !== "object") return null;
  const root = body as Record<string, unknown>;
  if (root.success === false) return null;
  const data = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : root;
  const uid = pickField(data, ["userId", "id", "uid", "uuid", "memberId"]);
  if (!uid) return null;
  return {
    uid,
    nickname: pickField(data, ["username", "nickname", "nickName", "name"]),
    avatar: pickField(data, ["profileImageUrl", "profileImage", "avatarUrl", "imageUrl"]),
  };
}

// SSO 자동로그인 — ① 본앱 세션을 브라우저가 직접 확인 → ② 게임 세션 발급.
// 반환: signed_up=true(로그인) / false(본앱 미로그인) / +offline(판정불가) / +bridge(연동 실패)
export async function ssoLogin(): Promise<Profile> {
  let me: CelebusMe | null = null;
  let netFail = false;
  // 개발 빌드는 본앱 직접 호출을 건너뜀(다른 오리진 세션 없음) — 서버 SSO_DEV_MOCK이 신원 대체
  if (process.env.NODE_ENV === "production") {
    try {
      const res = await fetch(CELEBUS_ME_URL, {
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (res.status === 401) return { signed_up: false }; // 비로그인 확정 (개발팀 규격)
      if (res.ok) me = extractUser(await res.json().catch(() => null));
      if (!me) netFail = true; // 5xx 또는 파싱 실패
    } catch {
      netFail = true; // 오프라인
    }
  }

  try {
    const res = await fetch("/api/auth/sso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(me ?? {}),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = (await res.json()) as Profile;
      return { ...data, signed_up: !!data?.signed_up };
    }
    if (me) return { signed_up: false, bridge: true }; // 본앱 확인됐는데 게임 세션 실패
    return { signed_up: false, offline: netFail };
  } catch {
    if (me) return { signed_up: false, bridge: true };
    return { signed_up: false, offline: true };
  }
}

// 저장된 게임 세션 기준 프로필 조회(SSO 재검증 없음 — 화면 갱신용)
export async function fetchProfile(): Promise<Profile> {
  try {
    const res = await fetch("/api/auth/me", { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error("bad_status");
    const data = (await res.json()) as Profile;
    return { ...data, signed_up: !!data?.signed_up };
  } catch {
    return { signed_up: false, offline: true };
  }
}

// 아바타 변경 — 기본 아바타 id 또는 업로드 이미지(dataURL). 성공 시 저장된 아바타 값(id 또는 URL) 반환.
export async function saveAvatar(input: { avatar?: string; image?: string }): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json()) as Record<string, unknown>;
    return data?.status === "ok" ? String(data.avatar) : null;
  } catch {
    return null;
  }
}
