import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { hashWithSalt, getClientIp } from "@/lib/hash";
import { assertSameOrigin } from "@/lib/origin";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });
  const { id } = await params;
  const reporterHash = hashWithSalt(getClientIp(req));

  const { error } = await admin().rpc("report_post", {
    p_id: id,
    p_reporter_hash: reporterHash,
    p_threshold: 5,
  });
  if (error) return NextResponse.json({ error: "처리 중 오류가 발생했어요." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
