import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { playerHash } from "@/lib/hash";
import { peekVoterId } from "@/lib/anon-identity";
import { GAME_CONFIG } from "@/lib/game-config";

// 서버 적용 중인 출석 설정 — game_config 오버라이드 우선, 없으면 코드 기본값.
// 모달의 7일 보상 사다리 표기가 실제 지급값과 어긋나지 않도록 상태 응답에 함께 내려준다.
async function dailyConfig(): Promise<{ base: number; streakStep: number; maxStreakDays: number }> {
  const fallback = GAME_CONFIG.daily;
  try {
    const { data } = await admin().from("game_config").select("config").eq("id", 1).maybeSingle();
    const d = (data?.config as { daily?: Partial<typeof fallback> } | null)?.daily;
    return {
      base: typeof d?.base === "number" ? d.base : fallback.base,
      streakStep: typeof d?.streakStep === "number" ? d.streakStep : fallback.streakStep,
      maxStreakDays: typeof d?.maxStreakDays === "number" ? d.maxStreakDays : fallback.maxStreakDays,
    };
  } catch {
    return fallback;
  }
}

// 데일리 출석 상태(수령 가능·스트릭·다음 보상 + 적용 중 보상 사다리 설정).
// 쿠키 없으면 첫 수령 프리뷰(base 보상).
export async function GET(req: Request) {
  const daily = await dailyConfig();
  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json({ claimable: true, streak: 0, next_reward: daily.base, daily });

  const { data, error } = await admin().rpc("game_daily_status", { p_player_hash: playerHash(anonId) });
  if (error) return NextResponse.json({ error: "처리 중 오류가 발생했어요." }, { status: 500 });
  return NextResponse.json({ ...(data ?? { claimable: true, streak: 0, next_reward: null }), daily });
}
