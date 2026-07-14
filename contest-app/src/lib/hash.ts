import { createHash } from "crypto";

// 솔트 결합 SHA-256 — 원본 IP/디바이스ID를 저장하지 않기 위한 단방향 해시
export function hashWithSalt(input: string): string {
  const salt = process.env.HASH_SALT ?? "dev-salt-change-me";
  return createHash("sha256").update(`${salt}:${input}`).digest("hex");
}

// 신뢰 가능한 클라이언트 IP 추출.
// Vercel은 x-vercel-forwarded-for(플랫폼이 세팅, 클라이언트 조작 불가) → x-real-ip 순으로 신뢰.
// x-forwarded-for는 최좌측이 클라이언트 제어값이라 최후순위(로컬 개발 폴백).
export function getClientIp(req: Request): string {
  const vercel = req.headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return "0.0.0.0";
}

// 투표자 식별 해시 — 클라이언트 디바이스ID 단독은 초기화·위조가 쉬우므로 서버 IP와 결합.
// 같은 IP+디바이스 조합만 중복으로 판정(같은 와이파이의 다른 팬은 디바이스ID가 달라 정상 투표 가능).
export function voterHash(deviceId: string, ip: string): string {
  return hashWithSalt(`vote:${ip}:${deviceId}`);
}
