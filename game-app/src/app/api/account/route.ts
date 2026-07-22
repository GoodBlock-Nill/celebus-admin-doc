import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { playerHash } from "@/lib/hash";
import { peekVoterId } from "@/lib/anon-identity";

// CELEB Point 잔액 + 인벤토리 조회. 쿠키 없으면(플레이 이력 없음) 0/빈값.
export async function GET(req: Request) {
  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json({ celeb_point: 0, inventory: {} });

  const { data, error } = await admin().rpc("game_get_account", { p_player_hash: playerHash(anonId) });
  if (error) return NextResponse.json({ error: "처리 중 오류가 발생했어요." }, { status: 500 });
  return NextResponse.json(data ?? { celeb_point: 0, inventory: {} });
}
