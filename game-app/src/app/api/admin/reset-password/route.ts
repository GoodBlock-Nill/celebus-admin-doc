import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { assertSameOrigin } from "@/lib/origin";

const schema = z.object({
  player_hash: z.string().regex(/^[a-f0-9]{16,64}$/),
  new_password: z.string().min(8).max(72),
});

// 비밀번호 분실 CS — 전화번호 대조 후 임시 비밀번호로 재설정 (감사 로그 기록, 비밀번호 자체는 로그 미저장)
export async function POST(req: Request) {
  if (!assertSameOrigin(req) || !requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_input" }, { status: 400 });

  const { data, error } = await admin().rpc("admin_reset_password", {
    p_h: parsed.data.player_hash,
    p_password: parsed.data.new_password,
  });
  if (error) return NextResponse.json({ error: "rpc" }, { status: 500 });
  if (data?.error) return NextResponse.json({ error: data.error }, { status: 400 });

  await logAdmin("reset_password", parsed.data.player_hash, null);
  return NextResponse.json({ status: "ok" });
}
