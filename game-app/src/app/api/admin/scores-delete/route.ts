import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { assertSameOrigin } from "@/lib/origin";

const schema = z.object({
  player_hash: z.string().regex(/^[a-f0-9]{16,64}$/),
  mode: z.enum(["daily", "free"]).optional(),
});

// 기록 삭제 (치터 제거) — 모드 미지정 시 전체
export async function POST(req: Request) {
  if (!assertSameOrigin(req) || !requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_input" }, { status: 400 });

  const { data, error } = await admin().rpc("admin_delete_scores", {
    p_h: parsed.data.player_hash,
    p_mode: parsed.data.mode ?? null,
  });
  if (error) return NextResponse.json({ error: "rpc" }, { status: 500 });
  await logAdmin("delete_scores", parsed.data.player_hash, { mode: parsed.data.mode ?? "all", deleted: data?.deleted });
  return NextResponse.json({ status: "ok", ...data });
}
