import type { SupabaseClient } from "@supabase/supabase-js";

// 관리자 액션 감사 로그 — best-effort (테이블 미존재/오류 시 조용히 무시).
export async function logAdmin(
  db: SupabaseClient,
  action: string,
  opts: { targetType?: "contest" | "entry" | "award"; targetId?: string | null; detail?: string } = {},
): Promise<void> {
  try {
    await db.from("admin_logs").insert({
      action,
      target_type: opts.targetType ?? "contest",
      target_id: opts.targetId ?? null,
      detail: opts.detail ?? null,
    });
  } catch {
    /* 로깅 실패는 본 작업에 영향 없음 */
  }
}
