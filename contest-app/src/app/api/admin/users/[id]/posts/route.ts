import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";

// 특정 유저(업로더)의 게시물 — 관리자 전용(콘텐츠 조치용). 공개 뷰와 달리 숨김 포함.
// 썸네일은 base 테이블 oembed jsonb에서 추출(공개 뷰는 owner_id 미노출·hidden 제외라 base 조회).
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!id || id.length < 8) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });

  const { data, error } = await admin()
    .from("stage_posts")
    .select("id, title, handle, hidden, is_official, like_count, view_count, created_at, oembed")
    .eq("owner_id", id)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return NextResponse.json({ error: "조회 실패" }, { status: 500 });

  const posts = (data ?? []).map((p) => {
    const oembed = (p.oembed ?? null) as { thumbnail_url?: string } | null;
    return {
      id: p.id as string,
      title: p.title as string,
      handle: p.handle as string,
      hidden: p.hidden as boolean,
      is_official: p.is_official as boolean,
      like_count: (p.like_count as number) ?? 0,
      view_count: (p.view_count as number) ?? 0,
      created_at: p.created_at as string,
      thumbnail_url: oembed?.thumbnail_url ?? null,
    };
  });
  return NextResponse.json({ posts });
}
