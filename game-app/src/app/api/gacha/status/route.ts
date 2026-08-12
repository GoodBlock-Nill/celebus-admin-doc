import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { playerHash } from "@/lib/hash";
import { peekVoterId } from "@/lib/anon-identity";

// 가챠 이용권 지갑 조회 — 무상(랭킹 보상)/유상(CP 구매) 분리 잔액
export async function GET(req: Request) {
  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json({ free_tickets: 0, paid_tickets: 0 });
  const { data, error } = await admin()
    .from("game_gacha_wallet")
    .select("free_tickets, paid_tickets")
    .eq("player_hash", playerHash(anonId))
    .maybeSingle();
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  return NextResponse.json(data ?? { free_tickets: 0, paid_tickets: 0 });
}
