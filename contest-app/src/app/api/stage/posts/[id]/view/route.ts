import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { assertSameOrigin } from "@/lib/origin";
import { peekUserId } from "@/lib/identity";
import { getClientIp, hashWithSalt } from "@/lib/hash";

// 조회수 집계 (Phase 3) — 열람은 비로그인 가능하므로 viewer_id는:
//   로그인 시 신원 id, 아니면 IP+UA 해시(어뷰징 방지 dedup용, 원문 미저장).
// 실제 집계·30분 창 dedup은 SECURITY DEFINER RPC(stage_record_view)가 수행. 클라 임의 증가 불가.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!assertSameOrigin(req)) return NextResponse.json({ code: "forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ code: "bad_input" }, { status: 400 });

  const user = peekUserId(req);
  const ua = req.headers.get("user-agent") ?? "";
  const viewer = user ?? `ip:${hashWithSalt(`${getClientIp(req)}|${ua}`)}`;

  const { data, error } = await admin().rpc("stage_record_view", { p_post: id, p_viewer: viewer });
  if (error || !data) return NextResponse.json({ code: "server" }, { status: 500 });
  if (data.error) return NextResponse.json({ code: data.error }, { status: 404 });
  return NextResponse.json({ counted: data.counted, view_count: data.view_count });
}
