import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { assertSameOrigin } from "@/lib/origin";
import { peekUserId } from "@/lib/identity";

// 댓글 삭제 — 본인만
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!assertSameOrigin(req)) return NextResponse.json({ code: "forbidden", error: "허용되지 않은 요청이에요." }, { status: 403 });
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ code: "bad_input", error: "잘못된 요청이에요." }, { status: 400 });

  const owner = peekUserId(req);
  if (!owner) return NextResponse.json({ code: "not_owner", error: "본인 댓글만 삭제할 수 있어요." }, { status: 403 });

  const { data, error } = await admin().rpc("comment_delete", { p_comment: id, p_owner: owner });
  if (error || !data) return NextResponse.json({ code: "server", error: "처리 중 오류가 발생했어요." }, { status: 500 });
  if (data.error) return NextResponse.json({ code: "not_owner", error: "본인 댓글만 삭제할 수 있어요." }, { status: 403 });
  return NextResponse.json({ ok: true });
}
