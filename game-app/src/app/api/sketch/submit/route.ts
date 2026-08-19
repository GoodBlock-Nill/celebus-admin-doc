import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { playerHash, getClientIp } from "@/lib/hash";
import { peekVoterId } from "@/lib/anon-identity";
import { assertSameOrigin } from "@/lib/origin";
import { voteThrottled } from "@/lib/ratelimit";

// 그림 제출 — 스트로크 벡터 로그 저장. W1은 즉시 공개(approved), W2에서 검수 큐(pending) 전환.
// 크기 상한: 획 400·획당 점 1200 — 60초 드로잉의 정상 상한을 넉넉히 웃도는 값 (폭주 페이로드 차단)
const pointSchema = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1), t: z.number().min(0).max(600000) });
const strokeSchema = z.object({
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  width: z.number().min(1).max(40),
  points: z.array(pointSchema).min(1).max(1200),
});
const bodySchema = z.object({
  word_id: z.string().uuid(),
  strokes: z.array(strokeSchema).min(1).max(400),
  duration_ms: z.number().int().min(0).max(600000),
});

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });
  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (voteThrottled(getClientIp(req))) return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "잘못된 그림 데이터예요." }, { status: 400 });

  const { data: word } = await admin().from("game_sketch_word").select("id").eq("id", parsed.data.word_id).eq("active", true).maybeSingle();
  if (!word) return NextResponse.json({ error: "잘못된 제시어예요." }, { status: 400 });

  const { data, error } = await admin()
    .from("game_sketch_drawing")
    .insert({
      player_hash: playerHash(anonId),
      word_id: parsed.data.word_id,
      strokes: parsed.data.strokes,
      duration_ms: parsed.data.duration_ms,
    })
    .select("id")
    .single();
  if (error || !data) return NextResponse.json({ error: "제출에 실패했어요." }, { status: 500 });
  return NextResponse.json({ status: "ok", id: data.id });
}
