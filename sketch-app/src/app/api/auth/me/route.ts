import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { playerHash } from "@/lib/hash";
import { peekVoterId } from "@/lib/anon-identity";

// 세션 프로필 조회 — 쿠키 없으면 미가입.
export async function GET(req: Request) {
  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json({ signed_up: false });

  const { data, error } = await admin().rpc("game_get_profile", { p_player_hash: playerHash(anonId) });
  if (error) return NextResponse.json({ signed_up: false });
  return NextResponse.json(data ?? { signed_up: false });
}
