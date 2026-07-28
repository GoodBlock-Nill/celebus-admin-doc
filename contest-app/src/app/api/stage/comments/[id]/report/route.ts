import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { assertSameOrigin } from "@/lib/origin";
import { getUserId, setIdentityCookie } from "@/lib/identity";

// 댓글 신고 — 신원당 1회, 누적 3회 자동 숨김(RPC)
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!assertSameOrigin(req)) return NextResponse.json({ code: "forbidden", error: "허용되지 않은 요청이에요." }, { status: 403 });
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ code: "bad_input", error: "잘못된 요청이에요." }, { status: 400 });

  const user = getUserId(req);
  const { data, error } = await admin().rpc("comment_report", { p_comment: id, p_reporter: user.id });
  if (error || !data) return NextResponse.json({ code: "server", error: "처리 중 오류가 발생했어요." }, { status: 500 });
  if (data.error === "not_found") return NextResponse.json({ code: "not_found", error: "댓글을 찾을 수 없어요." }, { status: 404 });
  if (data.error === "already") return NextResponse.json({ code: "already", error: "이미 신고한 댓글이에요." }, { status: 409 });

  const res = NextResponse.json({ ok: true });
  if (user.isNew) setIdentityCookie(res.headers, user.id);
  return res;
}
