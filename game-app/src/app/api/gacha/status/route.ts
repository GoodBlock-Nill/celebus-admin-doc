import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { playerHash } from "@/lib/hash";
import { peekVoterId } from "@/lib/anon-identity";

// 가챠 현황 — 이용권 지갑(무상/유상) + 진행 중 이벤트·풀 공시 (공개 뷰 기반, 확률·잔여 투명 공개)
export async function GET(req: Request) {
  const [wallet, events] = await Promise.all([
    (async () => {
      const anonId = peekVoterId(req);
      if (!anonId) return { free_tickets: 0, paid_tickets: 0 };
      const { data } = await admin()
        .from("game_gacha_wallet")
        .select("free_tickets, paid_tickets")
        .eq("player_hash", playerHash(anonId))
        .maybeSingle();
      return data ?? { free_tickets: 0, paid_tickets: 0 };
    })(),
    (async () => {
      const { data, error } = await admin().from("game_gacha_event_public").select("*");
      return error ? [] : (data ?? []);
    })(),
  ]);
  return NextResponse.json({ ...wallet, events });
}
