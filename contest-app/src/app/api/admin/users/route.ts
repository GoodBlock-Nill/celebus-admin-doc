import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";

// 앱 유저(팬) 목록 — 관리자 전용. stage_users + 업로드 수(비공식 게시물 owner_id 집계).
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = admin();
  const [usersRes, postsRes] = await Promise.all([
    db
      .from("stage_users")
      .select("user_id, celebus_uid, nickname, avatar_url, created_at, last_login_at")
      .order("last_login_at", { ascending: false })
      .limit(2000),
    db.from("stage_posts").select("owner_id").eq("is_official", false),
  ]);
  if (usersRes.error) return NextResponse.json({ error: "조회 실패" }, { status: 500 });

  const counts = new Map<string, number>();
  for (const p of (postsRes.data ?? []) as { owner_id: string }[]) {
    counts.set(p.owner_id, (counts.get(p.owner_id) ?? 0) + 1);
  }
  const users = (usersRes.data ?? []).map((u) => ({ ...u, upload_count: counts.get(u.user_id) ?? 0 }));
  return NextResponse.json({ users });
}
