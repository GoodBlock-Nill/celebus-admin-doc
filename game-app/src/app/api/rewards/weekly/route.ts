import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { playerHash } from "@/lib/hash";
import { assertSameOrigin } from "@/lib/origin";
import { peekVoterId } from "@/lib/anon-identity";

// 지난주 랭킹 결과 조회 + 보상 자동 지급 (lazy claim — 중복 지급은 DB PK가 차단)
// CP(game_claim_week_reward)와 가챠 이용권(game_claim_week_tickets)을 함께 수령해 한 모달로 안내.
export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json({ has_result: false });
  const h = playerHash(anonId);

  const [cp, tk] = await Promise.all([
    admin().rpc("game_claim_week_reward", { p_player_hash: h }),
    admin().rpc("game_claim_week_tickets", { p_player_hash: h }),
  ]);
  // 한쪽이라도 실패하면 실패로 — 클라가 다음 접속에 재시도 (양쪽 모두 PK가 중복 지급을 차단하므로 재시도 안전)
  if (cp.error || tk.error) return NextResponse.json({ error: "rpc" }, { status: 500 });

  const cpData = cp.data ?? { has_result: false };
  const tkData = tk.data ?? { has_result: false };
  return NextResponse.json({
    ...cpData,
    has_result: !!(cpData.has_result || tkData.has_result),
    gacha: tkData,
  });
}
