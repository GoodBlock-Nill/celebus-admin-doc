import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { playerHash } from "@/lib/hash";
import { peekVoterId } from "@/lib/anon-identity";
import { GAME_CONFIG } from "@/lib/game-config";

// 쿠키 없는 첫 방문 프리뷰 base — game_config 오버라이드 우선, 없으면 코드 기본값.
async function previewBase(): Promise<number> {
  try {
    const { data } = await admin().from("game_config").select("config").eq("id", 1).maybeSingle();
    const base = (data?.config as { daily?: { base?: number } } | null)?.daily?.base;
    return typeof base === "number" ? base : GAME_CONFIG.daily.base;
  } catch {
    return GAME_CONFIG.daily.base;
  }
}

// 데일리 출석 상태(수령 가능·스트릭·다음 보상). 쿠키 없으면 첫 수령 프리뷰(base 보상).
export async function GET(req: Request) {
  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json({ claimable: true, streak: 0, next_reward: await previewBase() });

  const { data, error } = await admin().rpc("game_daily_status", { p_player_hash: playerHash(anonId) });
  if (error) return NextResponse.json({ error: "처리 중 오류가 발생했어요." }, { status: 500 });
  return NextResponse.json(data ?? { claimable: true, streak: 0, next_reward: null });
}
