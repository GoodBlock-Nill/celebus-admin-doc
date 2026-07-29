import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";

const schema = z.object({ featured: z.boolean() });

// 대표 영상 지정/해제 — 관리자 전용. 단일 대표(RPC가 나머지 해제)
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "입력값 오류" }, { status: 400 });

  const db = admin();
  const { error } = await db.rpc("stage_set_featured", { p_post: id, p_on: parsed.data.featured });
  if (error) return NextResponse.json({ error: "처리 실패" }, { status: 500 });
  await logAdmin(db, parsed.data.featured ? "홈 대표 영상 지정" : "홈 대표 영상 해제", { targetType: "stage", targetId: id });
  return NextResponse.json({ ok: true });
}
