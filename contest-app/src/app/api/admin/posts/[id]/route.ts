import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";

// featured(대표 지정) 또는 hidden(숨김) 조치 — 둘 중 하나 이상
const schema = z.object({ featured: z.boolean().optional(), hidden: z.boolean().optional() });

// 게시물 조치 — 관리자 전용. featured: 단일 대표(RPC가 나머지 해제) / hidden: 노출 숨김(유저 콘텐츠 조치)
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "입력값 오류" }, { status: 400 });
  const { featured, hidden } = parsed.data;
  if (featured === undefined && hidden === undefined) return NextResponse.json({ error: "조치 항목 없음" }, { status: 400 });

  const db = admin();

  if (typeof featured === "boolean") {
    const { error } = await db.rpc("stage_set_featured", { p_post: id, p_on: featured });
    if (error) return NextResponse.json({ error: "처리 실패" }, { status: 500 });
    await logAdmin(db, featured ? "홈 대표 영상 지정" : "홈 대표 영상 해제", { targetType: "stage", targetId: id });
  }

  if (typeof hidden === "boolean") {
    const { data: post } = await db.from("stage_posts").select("stage_id").eq("id", id).maybeSingle();
    const { error } = await db.from("stage_posts").update({ hidden }).eq("id", id);
    if (error) return NextResponse.json({ error: "처리 실패" }, { status: 500 });
    // 소속 아카이브 노출 영상 수 재계산(숨김은 카운트 제외)
    if (post?.stage_id) {
      const { count } = await db.from("stage_posts").select("*", { count: "exact", head: true }).eq("stage_id", post.stage_id).eq("hidden", false);
      await db.from("stages").update({ post_count: count ?? 0 }).eq("id", post.stage_id);
    }
    await logAdmin(db, hidden ? "게시물 숨김" : "게시물 숨김 해제", { targetType: "stage", targetId: id });
  }

  return NextResponse.json({ ok: true });
}

// 게시물 삭제 — 관리자 전용(공식 시드 정리 등). 소속 아카이브 post_count 재계산.
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });

  const db = admin();
  const { data: post } = await db.from("stage_posts").select("stage_id").eq("id", id).maybeSingle();
  const { error } = await db.from("stage_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  if (post?.stage_id) {
    const { count } = await db.from("stage_posts").select("*", { count: "exact", head: true }).eq("stage_id", post.stage_id).eq("hidden", false);
    await db.from("stages").update({ post_count: count ?? 0 }).eq("id", post.stage_id);
  }
  await logAdmin(db, "게시물 삭제", { targetType: "stage", targetId: id });
  return NextResponse.json({ ok: true });
}
