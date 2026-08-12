import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { playerHash } from "@/lib/hash";
import { peekVoterId } from "@/lib/anon-identity";

// 내 실물 당첨 건 — 상태·기한·수령 정보(본인 것만). 기한 경과분은 조회 시점에 expired로 표시 (cron 없음).
export async function GET(req: Request) {
  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json({ winners: [] });

  const { data, error } = await admin()
    .from("game_prize_winner")
    .select(
      "id, status, claim_deadline, snapshot, created_at, game_gacha_draw(game_gacha_pool_item(requires_address, fulfillment, image_url)), game_prize_claim_info(name, phone, address, note)"
    )
    .eq("player_hash", playerHash(anonId))
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });

  const winners = (data ?? []).map((w) => {
    const raw = w as Record<string, unknown>;
    const draw = raw.game_gacha_draw as { game_gacha_pool_item?: { requires_address?: boolean; fulfillment?: string; image_url?: string | null } } | null;
    const info = raw.game_prize_claim_info as { name: string; phone: string; address: string | null; note: string | null } | null;
    const expired = (w.status === "pending" || w.status === "submitted") && new Date(w.claim_deadline) < new Date();
    return {
      id: w.id,
      status: expired && w.status === "pending" ? "expired" : w.status, // submitted는 기한 후에도 발송 대상 유지 (모바일 티켓 포함)
      claim_deadline: w.claim_deadline,
      snapshot: w.snapshot,
      requires_address: !!draw?.game_gacha_pool_item?.requires_address,
      fulfillment: draw?.game_gacha_pool_item?.fulfillment ?? "delivery",
      image_url: draw?.game_gacha_pool_item?.image_url ?? null, // 카드 썸네일 (보상내역 리스트)
      created_at: w.created_at, // 당첨일
      info: info ? { name: info.name, phone: info.phone, address: info.address ?? "", note: info.note ?? "" } : null,
    };
  });
  return NextResponse.json({ winners });
}
