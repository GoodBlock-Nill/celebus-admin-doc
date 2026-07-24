import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { playerHash } from "@/lib/hash";
import { peekVoterId } from "@/lib/anon-identity";

// 리더보드 화면에서 "내 순위"(모드별) 표시용. 쿠키가 없으면(=플레이 이력 없음) 빈 랭크 반환.
const EMPTY_RANK = {
  normal_rank: null,
  normal_total: null,
  normal_best_level: null,
  item_rank: null,
  item_total: null,
  item_best_level: null,
};

export async function GET(req: Request) {
  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json(EMPTY_RANK);

  // period: week/month = 기간 랭킹(KST), 그 외 = 전체(기존)
  const period = new URL(req.url).searchParams.get("period");
  const { data, error } =
    period === "week" || period === "month"
      ? await admin().rpc("game_player_rank_period", { p_player_hash: playerHash(anonId), p_period: period })
      : await admin().rpc("game_player_rank", { p_player_hash: playerHash(anonId) });
  if (error) return NextResponse.json({ error: "처리 중 오류가 발생했어요." }, { status: 500 });
  return NextResponse.json(data ?? EMPTY_RANK);
}
