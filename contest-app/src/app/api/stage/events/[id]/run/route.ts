import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { assertSameOrigin } from "@/lib/origin";
import { requireUserId, peekUserId } from "@/lib/identity";

const VOTE_CAP = 3; // worldcup_submit_run의 신원당 집계 캡과 동일

const bodySchema = z.object({
  picks: z.array(z.object({ w: z.string().uuid(), l: z.string().uuid() })).min(1).max(31),
  winner: z.string().uuid(),
});

// 내 집계 런 수 조회 (잔여 투표 표시용)
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ counted_runs: 0, cap: VOTE_CAP });
  const user = peekUserId(req);
  if (!user) return NextResponse.json({ counted_runs: 0, cap: VOTE_CAP });
  const { count } = await admin()
    .from("worldcup_runs")
    .select("*", { count: "exact", head: true })
    .eq("event_id", id)
    .eq("user_id", user)
    .eq("counted", true);
  return NextResponse.json({ counted_runs: count ?? 0, cap: VOTE_CAP });
}

// 월드컵 런 제출 — 구조·소속 검증과 집계는 RPC(신원당 3회 캡)
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!assertSameOrigin(req)) return NextResponse.json({ code: "forbidden", error: "허용되지 않은 요청이에요." }, { status: 403 });
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ code: "bad_input", error: "잘못된 요청이에요." }, { status: 400 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ code: "bad_input", error: "입력값을 확인해주세요." }, { status: 400 });

  const user = requireUserId(req);
  if (!user) return NextResponse.json({ code: "login_required", error: "CELEBUS 로그인이 필요해요." }, { status: 401 });
  const { data, error } = await admin().rpc("worldcup_submit_run", {
    p_event: id,
    p_user: user,
    p_picks: parsed.data.picks,
    p_winner: parsed.data.winner,
  });
  if (error || !data) return NextResponse.json({ code: "server", error: "처리 중 오류가 발생했어요." }, { status: 500 });
  if (data.error === "closed") return NextResponse.json({ code: "closed", error: "진행 중인 이벤트가 아니에요." }, { status: 400 });
  if (data.error === "bad_bracket") return NextResponse.json({ code: "bad_input", error: "대진 정보가 올바르지 않아요." }, { status: 400 });

  return NextResponse.json({ counted: data.counted });
}
