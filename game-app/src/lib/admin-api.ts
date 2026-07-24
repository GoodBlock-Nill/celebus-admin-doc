// 관리자 화면 클라이언트 fetch 헬퍼 — 401이면 "auth" 에러로 로그인 화면 복귀
export class AdminAuthError extends Error {}

async function handle(res: Response): Promise<unknown> {
  if (res.status === 401) throw new AdminAuthError("auth");
  return res.json();
}

export async function aget<T>(path: string): Promise<T> {
  return (await handle(await fetch(path))) as T;
}

export async function asend<T>(path: string, method: "POST" | "PUT" | "DELETE", body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return (await handle(res)) as T;
}
