import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { hashWithSalt } from "@/lib/hash";
import { assertSameOrigin } from "@/lib/origin";
import { peekVoterId } from "@/lib/anon-identity";

// 현재 쿠키 신원이 이미 좋아요한 댓글 ID 목록 반환 — 버튼 상태 서버 동기화.
const schema = z.object({ ids: z.array(z.string().uuid()).max(300) });

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ liked: [] }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || parsed.data.ids.length === 0) return NextResponse.json({ liked: [] });

  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json({ liked: [] });

  const { data } = await admin()
    .from("comment_likes")
    .select("comment_id")
    .eq("voter_hash", hashWithSalt(`like:${anonId}`))
    .in("comment_id", parsed.data.ids);

  return NextResponse.json({ liked: (data ?? []).map((r) => r.comment_id as string) });
}
