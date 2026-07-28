import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { peekUserId } from "@/lib/identity";

// 내 게시물 목록 + (선택) 하트 상태 조회 — 신원 쿠키 기반, 서버 전용 RPC 경유
export async function GET(req: Request) {
  const user = peekUserId(req);
  if (!user) return NextResponse.json({ posts: [], liked: [] });

  const url = new URL(req.url);
  const likedFor = (url.searchParams.get("liked_for") ?? "")
    .split(",")
    .filter((s) => z.string().uuid().safeParse(s).success)
    .slice(0, 100);

  const db = admin();
  const [postsRes, likedRes] = await Promise.all([
    db.rpc("stage_my_posts", { p_owner: user }),
    likedFor.length ? db.rpc("stage_my_likes", { p_voter: user, p_posts: likedFor }) : Promise.resolve({ data: [], error: null }),
  ]);
  return NextResponse.json({
    posts: postsRes.error ? [] : (postsRes.data ?? []),
    liked: likedRes.error ? [] : (likedRes.data ?? []),
  });
}
