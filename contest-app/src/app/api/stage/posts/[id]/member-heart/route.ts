import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { assertSameOrigin } from "@/lib/origin";
import { peekUserId } from "@/lib/identity";

// 멤버 하트 토글 — stage_members에 등록된 신원(멤버 본인)만. 운영자 대행 없음(기획 §3.2 원칙).
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!assertSameOrigin(req)) return NextResponse.json({ code: "forbidden", error: "허용되지 않은 요청이에요." }, { status: 403 });
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ code: "bad_input", error: "잘못된 요청이에요." }, { status: 400 });

  const user = peekUserId(req);
  if (!user) return NextResponse.json({ code: "not_member", error: "멤버만 사용할 수 있어요." }, { status: 403 });

  const { data, error } = await admin().rpc("member_toggle_heart", { p_post: id, p_member: user });
  if (error || !data) return NextResponse.json({ code: "server", error: "처리 중 오류가 발생했어요." }, { status: 500 });
  if (data.error === "not_member") return NextResponse.json({ code: "not_member", error: "멤버만 사용할 수 있어요." }, { status: 403 });
  if (data.error === "not_found") return NextResponse.json({ code: "not_found", error: "게시물을 찾을 수 없어요." }, { status: 404 });
  return NextResponse.json({ hearted: data.hearted });
}
