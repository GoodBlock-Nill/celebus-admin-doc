// 서버 서명 익명 식별 쿠키 — 투표 dedup 신원. 클라이언트 localStorage 대신 위조 불가 쿠키 사용.
// 쿠키값 = "<anonId>.<hmac>". anonId는 서버가 발급, HMAC(HASH_SALT)로 서명 → 위조·재발급 억제.
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

export const VID_COOKIE = "cfs_vid";

export const VID_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // 1년 — 정상 사용자는 재발급 불필요
};

function secret(): string {
  return process.env.HASH_SALT ?? "dev-salt-change-me";
}

function sign(id: string): string {
  return createHmac("sha256", secret()).update(id).digest("hex");
}

export function signAnonId(id: string): string {
  return `${id}.${sign(id)}`;
}

// 쿠키값 서명 검증 → 유효 anonId 또는 null
function verify(value: string): string | null {
  const dot = value.lastIndexOf(".");
  if (dot < 1) return null;
  const id = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (!/^[a-f0-9]{16,64}$/.test(id) || !/^[a-f0-9]{64}$/.test(sig)) return null;
  const expected = sign(id);
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return null;
  } catch {
    return null;
  }
  return id;
}

// 요청 쿠키에서 서명 검증된 anonId 추출. 없거나 위조면 새 id 발급 후보(isNew=true) 반환.
export function readVoterId(req: Request): { id: string; isNew: boolean } {
  const raw = req.headers.get("cookie") ?? "";
  const m = raw.match(new RegExp(`(?:^|;\\s*)${VID_COOKIE}=([^;]+)`));
  if (m) {
    const id = verify(decodeURIComponent(m[1]));
    if (id) return { id, isNew: false };
  }
  return { id: randomBytes(16).toString("hex"), isNew: true };
}
