import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { peekUserId } from "@/lib/identity";

// 내 게시물 목록 + (선택) 하트 상태 조회 — 신원 쿠키 기반, 서버 전용 RPC 경유
// 멤버 하트는 비공개(ix 편애 논란 차단): 여기서만 노출한다.
//  - memberHearts: 내가 올린 영상별 멤버 하트 "수"(익명 집계, 업로더 본인만)
//  - memberHearted: member_heart_for에 준 post 중 내(멤버)가 하트를 누른 목록(토글 상태)
export async function GET(req: Request) {
  const user = peekUserId(req);
  if (!user) return NextResponse.json({ posts: [], liked: [], memberHearts: [], memberHearted: [] });

  const url = new URL(req.url);
  const uuids = (raw: string | null) =>
    (raw ?? "")
      .split(",")
      .filter((s) => z.string().uuid().safeParse(s).success)
      .slice(0, 100);
  const likedFor = uuids(url.searchParams.get("liked_for"));
  const memberHeartFor = uuids(url.searchParams.get("member_heart_for"));

  const db = admin();
  const [postsRes, likedRes, memberHeartedRes] = await Promise.all([
    db.rpc("stage_my_posts", { p_owner: user }),
    likedFor.length ? db.rpc("stage_my_likes", { p_voter: user, p_posts: likedFor }) : Promise.resolve({ data: [], error: null }),
    memberHeartFor.length
      ? db.from("member_hearts").select("post_id").eq("member_id", user).in("post_id", memberHeartFor)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const posts = postsRes.error ? [] : (postsRes.data ?? []);

  // 업로더 본인 영상의 멤버 하트 수(익명) — 누가 눌렀는지는 제공하지 않는다
  let memberHearts: { post_id: string; count: number }[] = [];
  const myIds = (posts as { id: string }[]).map((p) => p.id).filter(Boolean);
  if (myIds.length) {
    const { data: mh } = await db.from("member_hearts").select("post_id").in("post_id", myIds);
    const counts = new Map<string, number>();
    for (const r of (mh ?? []) as { post_id: string }[]) counts.set(r.post_id, (counts.get(r.post_id) ?? 0) + 1);
    memberHearts = [...counts.entries()].map(([post_id, count]) => ({ post_id, count }));
  }

  return NextResponse.json({
    posts,
    liked: likedRes.error ? [] : (likedRes.data ?? []),
    memberHearts,
    memberHearted: memberHeartedRes.error ? [] : ((memberHeartedRes.data ?? []) as { post_id: string }[]).map((r) => r.post_id),
  });
}
