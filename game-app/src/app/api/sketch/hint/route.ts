import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { playerHash, getClientIp } from "@/lib/hash";
import { peekVoterId } from "@/lib/anon-identity";
import { assertSameOrigin } from "@/lib/origin";
import { voteThrottled } from "@/lib/ratelimit";

const bodySchema = z.object({ drawing_id: z.string().uuid() });

// 힌트(첫 글자 공개) — 10 CP 소모, 그림당 1회. 차감·공개는 서버 RPC가 원자 처리 (§7 가벼운 CP 소비처)
export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });
  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (voteThrottled(getClientIp(req))) return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });

  const { data, error } = await admin().rpc("game_sketch_hint_exec", {
    p_h: playerHash(anonId),
    p_drawing: parsed.data.drawing_id,
  });
  if (error) return NextResponse.json({ error: "힌트를 불러오지 못했어요." }, { status: 500 });
  return NextResponse.json(data ?? {});
}
