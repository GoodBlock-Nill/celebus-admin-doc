import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { playerHash } from "@/lib/hash";
import { assertSameOrigin } from "@/lib/origin";
import { peekVoterId } from "@/lib/anon-identity";

// 지난주 랭킹 결과 조회 + 보상 자동 지급 (lazy claim — 중복 지급은 DB PK가 차단)
export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json({ has_result: false });

  const { data, error } = await admin().rpc("game_claim_week_reward", { p_player_hash: playerHash(anonId) });
  if (error) return NextResponse.json({ error: "rpc" }, { status: 500 }); // 실패는 실패로 — 클라가 다음 접속에 재시도
  return NextResponse.json(data ?? { has_result: false });
}
