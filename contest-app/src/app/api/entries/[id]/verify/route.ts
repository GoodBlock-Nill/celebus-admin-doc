import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { verifyEntrySchema } from "@/lib/schema";
import { assertSameOrigin } from "@/lib/origin";
import { getClientIp } from "@/lib/hash";
import { tooManyAttempts, resetAttempts } from "@/lib/ratelimit";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }
  const parsed = verifyEntrySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });

  const key = `verify:${getClientIp(req)}:${id}`;
  if (tooManyAttempts(key)) {
    return NextResponse.json({ error: "시도가 너무 많아요. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const { data: ok, error } = await admin().rpc("contest_verify_entry", {
    p_id: id,
    p_password: parsed.data.password,
  });
  if (error) return NextResponse.json({ error: "처리 중 오류가 발생했어요." }, { status: 500 });
  if (ok === true) resetAttempts(key);
  return NextResponse.json({ ok: ok === true });
}
