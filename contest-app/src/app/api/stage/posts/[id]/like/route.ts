import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { assertSameOrigin } from "@/lib/origin";
import { requireUserId } from "@/lib/identity";
import { voteThrottled } from "@/lib/ratelimit";
import { getClientIp } from "@/lib/hash";

// 팬 하트 토글 (W1) — 계정(신원)당 1하트, 재탭 시 취소
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!assertSameOrigin(req)) return NextResponse.json({ code: "forbidden", error: "허용되지 않은 요청이에요." }, { status: 403 });
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ code: "bad_input", error: "잘못된 요청이에요." }, { status: 400 });

  if (voteThrottled(getClientIp(req))) {
    return NextResponse.json({ code: "throttled", error: "잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const user = requireUserId(req);
  if (!user) return NextResponse.json({ code: "login_required", error: "CELEBUS 로그인이 필요해요." }, { status: 401 });
  const { data, error } = await admin().rpc("stage_toggle_like", { p_post: id, p_voter: user });
  if (error || !data) return NextResponse.json({ code: "server", error: "처리 중 오류가 발생했어요." }, { status: 500 });
  if (data.error === "not_found") return NextResponse.json({ code: "not_found", error: "게시물을 찾을 수 없어요." }, { status: 404 });

  return NextResponse.json({ liked: data.liked, like_count: data.like_count });
}
