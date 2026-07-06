// 관리자 인증 — Authorization: Bearer <ADMIN_PASSWORD>
export function isAdmin(req: Request): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  return req.headers.get("authorization") === `Bearer ${pw}`;
}
