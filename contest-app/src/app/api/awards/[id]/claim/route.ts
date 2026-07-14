import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { claimSchema } from "@/lib/schema";
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
  const parsed = claimSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." }, { status: 400 });
  }

  // 4자리 비밀번호 무차별 대입(굿즈 탈취) 방어
  const key = `claim:${getClientIp(req)}:${id}`;
  if (tooManyAttempts(key)) {
    return NextResponse.json({ error: "시도가 너무 많아요. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const { password, ...info } = parsed.data;
  const { data: ok, error } = await admin().rpc("contest_submit_claim", {
    p_award_id: id,
    p_password: password,
    p_info: { ...info, agreed_at: new Date().toISOString() },
  });
  if (error) return NextResponse.json({ error: "처리 중 오류가 발생했어요." }, { status: 500 });
  if (!ok) {
    return NextResponse.json({ error: "비밀번호가 일치하지 않거나 이미 접수된 보상이에요." }, { status: 403 });
  }
  resetAttempts(key);
  return NextResponse.json({ ok: true });
}
