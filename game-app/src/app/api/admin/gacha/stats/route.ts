import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";

// 럭키드로우 이벤트 진행 통계 (상세 화면 전용, 읽기만) — 뽑기 횟수·참여자 수·실물 당첨 상태 요약.
// 참여자 수는 최근 뽑기 1만 건 내 중복 제거 — 초대형 상시 이벤트에서는 근사치.
const PLAYER_SAMPLE_LIMIT = 10000;

export async function GET(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const eventId = new URL(req.url).searchParams.get("event_id");
  if (!eventId) return NextResponse.json({ error: "bad_input" }, { status: 400 });

  const [draws, players, winners] = await Promise.all([
    admin().from("game_gacha_draw").select("id", { count: "exact", head: true }).eq("event_id", eventId),
    admin()
      .from("game_gacha_draw")
      .select("player_hash, created_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .limit(PLAYER_SAMPLE_LIMIT),
    admin().from("game_prize_winner").select("status, game_gacha_draw!inner(event_id)").eq("game_gacha_draw.event_id", eventId),
  ]);
  if (draws.error || players.error || winners.error) return NextResponse.json({ error: "db" }, { status: 500 });

  const winnerCounts: Record<string, number> = {};
  for (const w of winners.data ?? []) winnerCounts[w.status] = (winnerCounts[w.status] ?? 0) + 1;

  return NextResponse.json({
    draws: draws.count ?? 0,
    players: new Set((players.data ?? []).map((d) => d.player_hash)).size,
    last_draw_at: players.data?.[0]?.created_at ?? null,
    winners: winnerCounts,
  });
}
