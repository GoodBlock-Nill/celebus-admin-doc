// 관리자 세션 — ADMIN_KEY(env) 검증 후 HMAC 서명 쿠키 발급(12시간). 서버 전용.
import { createHmac, timingSafeEqual } from "crypto";

export const ADM_COOKIE = "cfg_adm";

export const ADM_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 12,
};

function token(): string {
  const salt = process.env.HASH_SALT ?? "dev-salt-change-me";
  const key = process.env.ADMIN_KEY ?? "";
  return createHmac("sha256", salt).update(`admin-session:${key}`).digest("hex");
}

export function adminKeyValid(input: string): boolean {
  const key = process.env.ADMIN_KEY ?? "";
  if (!key || !input) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function adminSessionValue(): string {
  return token();
}

// 요청 쿠키의 관리자 세션 검증
export function requireAdmin(req: Request): boolean {
  if (!process.env.ADMIN_KEY) return false; // 키 미설정 환경에서는 전면 차단
  const raw = req.headers.get("cookie") ?? "";
  const m = raw.match(new RegExp(`(?:^|;\\s*)${ADM_COOKIE}=([^;]+)`));
  if (!m) return false;
  const v = decodeURIComponent(m[1]);
  const expected = token();
  try {
    return v.length === expected.length && timingSafeEqual(Buffer.from(v), Buffer.from(expected));
  } catch {
    return false;
  }
}
