import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { playerHash } from "@/lib/hash";
import { assertSameOrigin } from "@/lib/origin";
import { peekVoterId } from "@/lib/anon-identity";

// 실물 당첨 수령 정보 제출 — 본인·기한·상태를 서버가 검증. 기한 내 수정 재제출 허용.
// 개인정보는 격리 테이블(game_prize_claim_info)에만 저장 — 목적: 상품 발송, 발송 완료 후 90일 파기.
const claimSchema = z.object({
  winner_id: z.string().uuid(),
  name: z.string().trim().min(1).max(40),
  phone: z
    .string()
    .trim()
    .regex(/^\d{5,15}$/), // '-' 없이 숫자만 (가입 폼과 동일 규격)
  address: z.string().trim().max(200).optional().default(""),
  note: z.string().trim().max(200).optional().default(""),
  agree: z.literal(true), // 개인정보 수집·이용 동의 필수
});

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = claimSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_input" }, { status: 400 });
  const { winner_id, name, phone, address, note } = parsed.data;

  const { data: winner, error } = await admin()
    .from("game_prize_winner")
    .select("id, player_hash, status, claim_deadline, game_gacha_draw(game_gacha_pool_item(requires_address))")
    .eq("id", winner_id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  if (!winner || winner.player_hash !== playerHash(anonId)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (winner.status !== "pending" && winner.status !== "submitted") return NextResponse.json({ error: "bad_status" }, { status: 400 });
  if (new Date(winner.claim_deadline) < new Date()) return NextResponse.json({ error: "expired" }, { status: 400 });

  const draw = (winner as Record<string, unknown>).game_gacha_draw as { game_gacha_pool_item?: { requires_address?: boolean } } | null;
  if (draw?.game_gacha_pool_item?.requires_address && !address) {
    return NextResponse.json({ error: "address_required" }, { status: 400 });
  }

  // 수령 정보 upsert — 최초 제출 시각을 동의 시각으로 보존 (재제출은 내용만 갱신)
  const { data: existing } = await admin().from("game_prize_claim_info").select("winner_id").eq("winner_id", winner_id).maybeSingle();
  const info = { name, phone, address: address || null, note: note || null, updated_at: new Date().toISOString() };
  const { error: upErr } = existing
    ? await admin().from("game_prize_claim_info").update(info).eq("winner_id", winner_id)
    : await admin().from("game_prize_claim_info").insert({ ...info, winner_id, agreed_at: new Date().toISOString() });
  if (upErr) return NextResponse.json({ error: "db" }, { status: 500 });

  const { error: stErr } = await admin()
    .from("game_prize_winner")
    .update({ status: "submitted", submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", winner_id);
  if (stErr) return NextResponse.json({ error: "db" }, { status: 500 });

  return NextResponse.json({ status: "ok" });
}
