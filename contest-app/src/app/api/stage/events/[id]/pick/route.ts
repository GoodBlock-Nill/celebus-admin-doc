import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { assertSameOrigin } from "@/lib/origin";
import { peekUserId } from "@/lib/identity";

// 아티스트 픽 — 멤버 본인만. 이벤트 진행 중 교체 가능, 발표 시 공개.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!assertSameOrigin(req)) return NextResponse.json({ code: "forbidden", error: "허용되지 않은 요청이에요." }, { status: 403 });
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ code: "bad_input", error: "잘못된 요청이에요." }, { status: 400 });

  const body = z.object({ post_id: z.string().uuid() }).safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ code: "bad_input", error: "입력값을 확인해주세요." }, { status: 400 });

  const user = peekUserId(req);
  if (!user) return NextResponse.json({ code: "not_member", error: "멤버만 사용할 수 있어요." }, { status: 403 });

  const { data, error } = await admin().rpc("member_set_pick", { p_event: id, p_member: user, p_post: body.data.post_id });
  if (error || !data) return NextResponse.json({ code: "server", error: "처리 중 오류가 발생했어요." }, { status: 500 });
  if (data.error === "not_member") return NextResponse.json({ code: "not_member", error: "멤버만 사용할 수 있어요." }, { status: 403 });
  if (data.error === "closed") return NextResponse.json({ code: "closed", error: "진행 중인 이벤트가 아니에요." }, { status: 400 });
  if (data.error === "not_found") return NextResponse.json({ code: "not_found", error: "게시물을 찾을 수 없어요." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// 내 픽 조회 (멤버 본인)
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ pick: null });
  const user = peekUserId(req);
  if (!user) return NextResponse.json({ pick: null });
  const { data } = await admin().rpc("member_my_pick", { p_event: id, p_member: user });
  return NextResponse.json({ pick: data?.post_id ?? null });
}
