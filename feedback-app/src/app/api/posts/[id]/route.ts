import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { updateSchema, deleteSchema } from "@/lib/schema";
import { containsProfanity } from "@/lib/profanity";
import { assertSameOrigin } from "@/lib/origin";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });
  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." }, { status: 400 });
  }
  const { password, target, category, title, nickname, body } = parsed.data;
  if (containsProfanity(title, nickname, body)) {
    return NextResponse.json({ error: "부적절한 표현이 포함되어 있어요." }, { status: 400 });
  }

  const { data: ok, error } = await admin().rpc("update_post", {
    p_id: id,
    p_password: password,
    p_target: target,
    p_category: category,
    p_title: title,
    p_nickname: nickname,
    p_body: body,
  });
  if (error) return NextResponse.json({ error: "수정 중 오류가 발생했어요." }, { status: 500 });
  if (!ok) return NextResponse.json({ error: "비밀번호가 일치하지 않아요." }, { status: 401 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Ctx) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });
  const { id } = await params;
  const parsed = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "비밀번호를 입력해주세요." }, { status: 400 });

  const { data: ok, error } = await admin().rpc("delete_post", { p_id: id, p_password: parsed.data.password });
  if (error) return NextResponse.json({ error: "삭제 중 오류가 발생했어요." }, { status: 500 });
  if (!ok) return NextResponse.json({ error: "비밀번호가 일치하지 않아요." }, { status: 401 });
  return NextResponse.json({ ok: true });
}
