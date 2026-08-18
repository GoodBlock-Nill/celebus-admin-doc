import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { playerHash } from "@/lib/hash";
import { peekVoterId } from "@/lib/anon-identity";

// CELEB PASS 현황 — 시즌 XP·수령 레벨 (+월초 7일 유예 중 지난 시즌 미수령분)
export async function GET(req: Request) {
  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json({});
  const { data, error } = await admin().rpc("game_pass_status", { p_h: playerHash(anonId) });
  if (error) return NextResponse.json({ error: "rpc" }, { status: 500 });
  return NextResponse.json(data ?? {});
}
