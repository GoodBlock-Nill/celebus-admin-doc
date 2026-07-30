import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";

// 최근 게시물 목록(대표 영상 지정용) — 관리자 전용
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await admin()
    .from("stage_posts_public")
    .select("id, title, handle, thumbnail_url, featured, is_official, stage_id, category, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  return NextResponse.json({ posts: data });
}
