import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { getClientIp } from "@/lib/hash";
import { assertSameOrigin } from "@/lib/origin";
import { voteThrottled } from "@/lib/ratelimit";

// 가입 퍼널 카운터 — 미가입 방문도 측정(신원 불요). signup_done은 가입 라우트가 직접 기록.
const schema = z.object({ step: z.enum(["visit", "gate_view", "signup_start", "first_game"]) });

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (voteThrottled(getClientIp(req))) return NextResponse.json({ status: "limit" });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ status: "rejected" }, { status: 400 });

  await admin().rpc("game_track_funnel", { p_step: parsed.data.step });
  return NextResponse.json({ status: "ok" });
}
