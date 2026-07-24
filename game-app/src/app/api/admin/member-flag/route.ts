import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { assertSameOrigin } from "@/lib/origin";

const schema = z.object({
  player_hash: z.string().regex(/^[a-f0-9]{16,64}$/),
  is_member: z.boolean(),
});

// V01D 멤버 지정/해제 — 랭킹 특별 표시·V01D 탭 노출 대상
export async function POST(req: Request) {
  if (!assertSameOrigin(req) || !requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_input" }, { status: 400 });

  const { data, error } = await admin().rpc("admin_set_member", {
    p_h: parsed.data.player_hash,
    p_on: parsed.data.is_member,
  });
  if (error) return NextResponse.json({ error: "rpc" }, { status: 500 });
  if (data?.error) return NextResponse.json({ error: data.error }, { status: 400 });

  await logAdmin("set_member", parsed.data.player_hash, { is_member: parsed.data.is_member });
  return NextResponse.json({ status: "ok", ...data });
}
