import { createHash } from "crypto";

// 솔트 결합 SHA-256 — 원본 IP/디바이스ID를 저장하지 않기 위한 단방향 해시
export function hashWithSalt(input: string): string {
  const salt = process.env.HASH_SALT ?? "dev-salt-change-me";
  return createHash("sha256").update(`${salt}:${input}`).digest("hex");
}

// Vercel/프록시 환경에서 클라이언트 IP 추출
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "0.0.0.0";
}
