import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { updateEntrySchema, deleteEntrySchema } from "@/lib/schema";
import { containsProfanity } from "@/lib/profanity";
import { assertSameOrigin } from "@/lib/origin";
import { getClientIp } from "@/lib/hash";
import { tooManyAttempts, resetAttempts } from "@/lib/ratelimit";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }
  const parsed = updateEntrySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." }, { status: 400 });
  }
  if (containsProfanity(parsed.data.title, parsed.data.description)) {
    return NextResponse.json({ error: "부적절한 표현이 포함되어 있어요." }, { status: 400 });
  }
  const key = `entry-pw:${getClientIp(req)}:${id}`;
  if (tooManyAttempts(key)) {
    return NextResponse.json({ error: "시도가 너무 많아요. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }
  const { data: ok, error } = await admin().rpc("contest_update_entry", {
    p_id: id,
    p_password: parsed.data.password,
    p_title: parsed.data.title,
    p_description: parsed.data.description,
  });
  if (error) return NextResponse.json({ error: "처리 중 오류가 발생했어요." }, { status: 500 });
  if (!ok) return NextResponse.json({ error: "비밀번호가 일치하지 않거나 지금은 수정할 수 없어요." }, { status: 403 });
  resetAttempts(key);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Ctx) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }
  const parsed = deleteEntrySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });

  const key = `entry-pw:${getClientIp(req)}:${id}`;
  if (tooManyAttempts(key)) {
    return NextResponse.json({ error: "시도가 너무 많아요. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }
  const { data: ok, error } = await admin().rpc("contest_delete_entry", {
    p_id: id,
    p_password: parsed.data.password,
  });
  if (error) return NextResponse.json({ error: "처리 중 오류가 발생했어요." }, { status: 500 });
  if (!ok) return NextResponse.json({ error: "비밀번호가 일치하지 않거나 지금은 삭제할 수 없어요." }, { status: 403 });
  resetAttempts(key);
  return NextResponse.json({ ok: true });
}
