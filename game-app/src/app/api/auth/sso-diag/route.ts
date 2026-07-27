import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdmin } from "@/lib/admin-log";
import { assertSameOrigin } from "@/lib/origin";

// SSO 연동 자가진단 수집 — 게이트에서 "본앱 직접 호출은 성공, 게임 SSO는 실패" 케이스를 기록.
// 값은 받지 않고 응답 필드 "이름"과 상태코드만 수집(개인정보 미수집). 관리자 로그에서 확인.
const schema = z.object({
  direct_status: z.number().int().min(0).max(599),
  sso_status: z.number().int().min(0).max(599),
  body_keys: z.array(z.string().max(64)).max(40).optional(),
  data_keys: z.array(z.string().max(64)).max(40).optional(),
});

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_input" }, { status: 400 });

  await logAdmin("sso_diag", null, parsed.data, "system");
  return NextResponse.json({ status: "ok" });
}
