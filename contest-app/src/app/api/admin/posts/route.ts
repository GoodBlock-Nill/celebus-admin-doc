import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";

// 게시물 목록 — 관리자 전용.
// 기본: 최근 50건(대표 영상 지정용). stage_id 지정 시 해당 스테이지 전체 조회(공식영상 목록용, limit 확대).
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const stageId = searchParams.get("stage_id");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 1000);

  let q = admin()
    .from("stage_posts_public")
    .select("id, title, handle, thumbnail_url, featured, is_official, stage_id, category, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (stageId) q = q.eq("stage_id", stageId);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  return NextResponse.json({ posts: data });
}
