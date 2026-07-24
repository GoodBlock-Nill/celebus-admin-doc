import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { assertSameOrigin } from "@/lib/origin";

const schema = z.object({
  player_hash: z.string().regex(/^[a-f0-9]{16,64}$/),
  delta: z.number().int().min(-100000).max(100000).refine((v) => v !== 0),
  reason: z.string().trim().min(1).max(80),
});

// CP 수동 지급/회수 (CS 보상 등) — 원장에 admin:{사유} 기록
export async function POST(req: Request) {
  if (!assertSameOrigin(req) || !requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_input" }, { status: 400 });
  const { player_hash, delta, reason } = parsed.data;

  const { data, error } = await admin().rpc("admin_adjust_point", { p_h: player_hash, p_delta: delta, p_reason: reason });
  if (error) return NextResponse.json({ error: "rpc" }, { status: 500 });
  await logAdmin("adjust_point", player_hash, { delta, reason });
  return NextResponse.json({ status: "ok", ...data });
}
