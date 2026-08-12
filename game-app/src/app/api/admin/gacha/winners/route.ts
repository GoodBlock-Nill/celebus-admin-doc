import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { assertSameOrigin } from "@/lib/origin";

// 실물 당첨자 관리 — 수령 정보는 기본 마스킹, 열람(reveal=1)·상태 변경은 전부 감사 로그.
const maskName = (s: string) => (s.length <= 1 ? s : s[0] + "*".repeat(Math.max(1, s.length - 1)));
const maskPhone = (s: string) => (s.length < 7 ? "***" : `${s.slice(0, 3)}-****-${s.slice(-4)}`);
const maskAddr = (s: string | null) => (s ? s.slice(0, 6) + " …" : null);

export async function GET(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const eventId = url.searchParams.get("event_id");
  const reveal = url.searchParams.get("reveal") === "1";
  if (!eventId) return NextResponse.json({ error: "bad_input" }, { status: 400 });

  const { data, error } = await admin()
    .from("game_prize_winner")
    .select(
      "id, player_hash, status, claim_deadline, snapshot, submitted_at, shipped_at, admin_memo, created_at, game_gacha_draw!inner(event_id, game_gacha_pool_item(prize, grade, requires_address)), game_prize_claim_info(name, phone, address, note, agreed_at)"
    )
    .eq("game_gacha_draw.event_id", eventId)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });

  if (reveal) await logAdmin("prize_info_reveal", eventId, { count: (data ?? []).length });

  const winners = (data ?? []).map((w) => {
    const raw = w as Record<string, unknown>;
    const info = raw.game_prize_claim_info as { name: string; phone: string; address: string | null; note: string | null; agreed_at: string } | null;
    const expired = (w.status === "pending" || w.status === "submitted") && new Date(w.claim_deadline) < new Date();
    return {
      id: w.id,
      status: w.status,
      display_expired: expired, // 조회 시점 기한 경과 표시 ([만료 확정] 전)
      claim_deadline: w.claim_deadline,
      snapshot: w.snapshot,
      submitted_at: w.submitted_at,
      shipped_at: w.shipped_at,
      admin_memo: w.admin_memo,
      created_at: w.created_at,
      info: info
        ? reveal
          ? { name: info.name, phone: info.phone, address: info.address, note: info.note, agreed_at: info.agreed_at }
          : { name: maskName(info.name), phone: maskPhone(info.phone), address: maskAddr(info.address), note: null, agreed_at: info.agreed_at }
        : null,
    };
  });
  return NextResponse.json({ winners, revealed: reveal });
}

// 상태 액션 — ship(발송 완료) / revoke(무효, 사유 필수) / expire(만료 확정, 기한 경과분만) / purge_info(개인정보 파기)
const patchSchema = z.object({
  winner_id: z.string().uuid(),
  action: z.enum(["ship", "revoke", "expire", "purge_info"]),
  memo: z.string().trim().max(300).optional().default(""),
});

export async function PATCH(req: Request) {
  if (!assertSameOrigin(req) || !requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_input" }, { status: 400 });
  const { winner_id, action, memo } = parsed.data;

  const { data: w } = await admin().from("game_prize_winner").select("id, status, claim_deadline").eq("id", winner_id).maybeSingle();
  if (!w) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const now = new Date().toISOString();
  if (action === "ship") {
    if (w.status !== "submitted") return NextResponse.json({ error: "bad_status" }, { status: 400 });
    await admin().from("game_prize_winner").update({ status: "shipped", shipped_at: now, admin_memo: memo || null, updated_at: now }).eq("id", winner_id);
  } else if (action === "revoke") {
    if (w.status === "shipped") return NextResponse.json({ error: "bad_status" }, { status: 400 });
    if (!memo) return NextResponse.json({ error: "memo_required" }, { status: 400 }); // 무효 사유 필수
    await admin().from("game_prize_winner").update({ status: "revoked", admin_memo: memo, updated_at: now }).eq("id", winner_id);
  } else if (action === "expire") {
    if (!(w.status === "pending" || w.status === "submitted") || new Date(w.claim_deadline) >= new Date()) {
      return NextResponse.json({ error: "bad_status" }, { status: 400 });
    }
    await admin().from("game_prize_winner").update({ status: "expired", admin_memo: memo || null, updated_at: now }).eq("id", winner_id);
  } else {
    // purge_info: 발송/무효/만료 종결 건의 개인정보만 삭제 (당첨 이력은 snapshot으로 유지 — 90일 보관 정책 운영 버튼)
    if (!["shipped", "expired", "revoked"].includes(w.status)) return NextResponse.json({ error: "bad_status" }, { status: 400 });
    await admin().from("game_prize_claim_info").delete().eq("winner_id", winner_id);
  }

  await logAdmin(`prize_${action}`, winner_id, { memo });
  return NextResponse.json({ status: "ok" });
}
