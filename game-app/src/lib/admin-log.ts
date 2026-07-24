// 관리자 액션 감사 로그 기록 (서버 전용) — 실패해도 액션은 진행(로그는 best-effort)
import { admin } from "./db-admin";

export async function logAdmin(action: string, target: string | null, detail: unknown): Promise<void> {
  try {
    await admin().from("game_admin_log").insert({ action, target, detail });
  } catch {
    /* ignore */
  }
}
