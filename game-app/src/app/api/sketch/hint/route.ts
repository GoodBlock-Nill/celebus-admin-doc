import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { playerHash, getClientIp } from "@/lib/hash";
import { peekVoterId } from "@/lib/anon-identity";
import { assertSameOrigin } from "@/lib/origin";
import { voteThrottled } from "@/lib/ratelimit";
import { computeBombIndices } from "@/lib/sketch-tiles";

// 힌트 = 더미 타일 제거 (Draw Something 폭탄 방식, 10 CP·그림당 1회).
// "첫 글자 공개"는 한 글자 정답에서 정답 유출이라 폐기 (2026-08-19).
// 서버 RPC는 과금·1회 제한·정답 확보만 담당(정답은 클라에 미전송), 이 라우트가 유저 타일에서
// 정답에 불필요한 더미의 절반을 골라 제거 인덱스만 내려준다.
const bodySchema = z.object({
  drawing_id: z.string().uuid(),
  lang: z.enum(["ko", "en", "ja"]).default("ko"),
  tiles: z.array(z.string().min(1).max(4)).min(1).max(24),
});

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
    p_lang: parsed.data.lang,
  });
  if (error) return NextResponse.json({ error: "힌트를 불러오지 못했어요." }, { status: 500 });
  if (data?.error) return NextResponse.json(data);

  const remove = computeBombIndices(String(data.answer ?? ""), parsed.data.tiles);
  return NextResponse.json({ status: "ok", remove, charged: data.charged ?? 0, celeb_point: data.celeb_point });
}
