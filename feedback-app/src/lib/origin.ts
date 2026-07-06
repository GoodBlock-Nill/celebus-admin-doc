// 간이 CSRF 방지 — 쓰기 요청은 동일 출처에서만 허용
export function assertSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // 동일 출처 요청은 Origin이 없을 수 있음(허용)
  try {
    const host = req.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
