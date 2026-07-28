// CELEBUS SSO 클라이언트 (W4) — 게임앱 검증 패턴 이식.
// ① 브라우저가 본앱 API를 직접 호출해 세션 확인(쿠키가 본앱 호스트 전용이라 서버 대리 불가)
// ② 확인된 신원으로 FanStage 세션(/api/auth/sso) 발급.
const CELEBUS_ME_URL = "https://api.client.celebus.xyz/v1/private/users/me";

type CelebusMe = { uid: string; nickname: string; avatar: string };
export type SsoResult = { signed_in: boolean; nickname?: string; is_member?: boolean; offline?: boolean; bridge?: boolean };

function extractUser(json: unknown): CelebusMe | null {
  if (!json || typeof json !== "object") return null;
  const root = json as Record<string, unknown>;
  const data = (root.data && typeof root.data === "object" ? root.data : root) as Record<string, unknown>;
  const uid = data.userId ?? data.id;
  if (!uid) return null;
  return { uid: String(uid), nickname: String(data.username ?? ""), avatar: String(data.profileImageUrl ?? "") };
}

export async function ssoLogin(): Promise<SsoResult> {
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
      if (res.status === 401) return { signed_in: false }; // 비로그인 확정 (본앱 규격)
      if (res.ok) me = extractUser(await res.json().catch(() => null));
      if (!me) netFail = true;
    } catch {
      netFail = true;
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
      const data = (await res.json()) as SsoResult;
      return { ...data, signed_in: !!data.signed_in };
    }
    if (me) return { signed_in: false, bridge: true }; // 본앱 확인됐는데 세션 발급 실패
    return { signed_in: false, offline: netFail };
  } catch {
    if (me) return { signed_in: false, bridge: true };
    return { signed_in: false, offline: true };
  }
}
