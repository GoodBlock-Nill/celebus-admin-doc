/** 간이 CSRF 방지 — 상태를 바꾸는 요청은 동일 출처에서만 허용한다. */
export function assertSameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // 동일 출처 요청은 Origin 헤더가 없을 수 있다(허용)
  try {
    return new URL(origin).host === req.headers.get('host');
  } catch {
    return false;
  }
}
