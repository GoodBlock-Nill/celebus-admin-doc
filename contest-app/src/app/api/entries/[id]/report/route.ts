import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { hashWithSalt, getClientIp } from "@/lib/hash";
import { assertSameOrigin } from "@/lib/origin";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  const { data: ok, error } = await admin().rpc("contest_report_entry", {
    p_entry_id: id,
    p_reporter_hash: hashWithSalt(`report:${getClientIp(req)}`),
  });
  if (error) return NextResponse.json({ error: "처리 중 오류가 발생했어요." }, { status: 500 });
  // ok=false는 이미 신고했거나 신고 불가 상태 — 사용자에게는 성공과 동일하게 안내(관측은 status로)
  return NextResponse.json({ ok: true, applied: ok === true });
}
