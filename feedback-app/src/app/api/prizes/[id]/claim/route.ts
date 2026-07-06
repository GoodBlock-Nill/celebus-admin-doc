import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { claimSchema } from "@/lib/schema";
import { assertSameOrigin } from "@/lib/origin";

type Ctx = { params: Promise<{ id: string }> };

// 보상 수령: 대상 글 비밀번호로 본인 확인 후 배송정보 저장 (배송정보는 서버 전용)
export async function POST(req: Request, { params }: Ctx) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });
  const { id } = await params;
  const parsed = claimSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." }, { status: 400 });
  }

  const { password, ...info } = parsed.data;
  const { data: ok, error } = await admin().rpc("submit_claim", {
    p_prize_id: id,
    p_password: password,
    p_info: info,
  });
  if (error) return NextResponse.json({ error: "처리 중 오류가 발생했어요." }, { status: 500 });
  if (!ok) return NextResponse.json({ error: "비밀번호가 일치하지 않아요." }, { status: 401 });
  return NextResponse.json({ ok: true });
}
