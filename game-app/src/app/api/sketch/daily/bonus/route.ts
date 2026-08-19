import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { playerHash } from "@/lib/hash";
import { peekVoterId } from "@/lib/anon-identity";
import { assertSameOrigin } from "@/lib/origin";

// 데일리 퀴즈 완주 보너스 — 오늘 세트(내 그림 제외) 전부 완료 시 +10 CP (서버 재검증, 1일 1회)
export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });
  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  const { data, error } = await admin().rpc("game_sketch_daily_bonus_claim", { p_h: playerHash(anonId) });
  if (error) return NextResponse.json({ error: "처리에 실패했어요." }, { status: 500 });
  return NextResponse.json(data ?? {});
}
