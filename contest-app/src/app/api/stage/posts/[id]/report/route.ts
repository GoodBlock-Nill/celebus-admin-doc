import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { assertSameOrigin } from "@/lib/origin";
import { requireUserId } from "@/lib/identity";

const bodySchema = z.object({ reason: z.string().trim().max(200).default("") });

// 게시물 신고 (W1) — 신원당 1회, 누적 5회 자동 숨김(RPC)
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!assertSameOrigin(req)) return NextResponse.json({ code: "forbidden", error: "허용되지 않은 요청이에요." }, { status: 403 });
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ code: "bad_input", error: "잘못된 요청이에요." }, { status: 400 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ code: "bad_input", error: "입력값을 확인해주세요." }, { status: 400 });

  const user = requireUserId(req);
  if (!user) return NextResponse.json({ code: "login_required", error: "CELEBUS 로그인이 필요해요." }, { status: 401 });
  const { data, error } = await admin().rpc("stage_report_post", { p_post: id, p_reporter: user, p_reason: parsed.data.reason });
  if (error || !data) return NextResponse.json({ code: "server", error: "처리 중 오류가 발생했어요." }, { status: 500 });
  if (data.error === "not_found") return NextResponse.json({ code: "not_found", error: "게시물을 찾을 수 없어요." }, { status: 404 });
  if (data.error === "already") return NextResponse.json({ code: "already", error: "이미 신고한 게시물이에요." }, { status: 409 });

  return NextResponse.json({ ok: true });
}
