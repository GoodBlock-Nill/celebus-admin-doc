import { timingSafeEqual } from "crypto";

// 관리자 인증 — Authorization: Bearer <ADMIN_PASSWORD> (상수시간 비교)
export function isAdmin(req: Request): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${pw}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
