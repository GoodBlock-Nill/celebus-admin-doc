import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { deleteCommentSchema } from "@/lib/schema";
import { assertSameOrigin } from "@/lib/origin";

type Ctx = { params: Promise<{ id: string }> };

// 댓글 삭제 (본인 비밀번호 확인)
export async function DELETE(req: Request, { params }: Ctx) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });
  const { id } = await params;
  const parsed = deleteCommentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "비밀번호를 입력해주세요." }, { status: 400 });

  const { data: ok, error } = await admin().rpc("delete_comment", { p_id: id, p_password: parsed.data.password });
  if (error) return NextResponse.json({ error: "처리 중 오류가 발생했어요." }, { status: 500 });
  if (!ok) return NextResponse.json({ error: "비밀번호가 일치하지 않아요." }, { status: 401 });
  return NextResponse.json({ ok: true });
}
