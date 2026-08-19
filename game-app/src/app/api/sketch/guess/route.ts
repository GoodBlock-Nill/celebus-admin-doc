import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { playerHash, getClientIp } from "@/lib/hash";
import { peekVoterId } from "@/lib/anon-identity";
import { assertSameOrigin } from "@/lib/origin";
import { voteThrottled } from "@/lib/ratelimit";

const bodySchema = z.object({ drawing_id: z.string().uuid(), answer: z.string().min(1).max(40) });

// 정답 판정 — 서버 RPC 단독 결정 (클라에 정답 평문 미전송, 시도 3회 제한은 RPC가 강제. 기획 §8)
export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });
  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (voteThrottled(getClientIp(req))) return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });

  const { data, error } = await admin().rpc("game_sketch_guess_exec", {
    p_h: playerHash(anonId),
    p_drawing: parsed.data.drawing_id,
    p_answer: parsed.data.answer,
  });
  if (error) return NextResponse.json({ error: "판정에 실패했어요." }, { status: 500 });
  return NextResponse.json(data ?? {});
}
