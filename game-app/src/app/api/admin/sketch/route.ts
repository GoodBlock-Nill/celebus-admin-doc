import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { assertSameOrigin } from "@/lib/origin";

// 스케치 검수·신고 처리 (관리자) — 보류(held)·신고 비공개(hidden) 큐 조회 + 승인/반려/복구.
// AI 1차 검수가 대부분을 처리하므로 여기는 예외 건만 흐른다 (W2 확정안).
export async function GET(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await admin()
    .from("game_sketch_drawing")
    .select("id, player_hash, strokes, duration_ms, status, ai_verdict, report_count, created_at, game_sketch_word(text)")
    .in("status", ["held", "hidden", "pending"])
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });

  const { count: approvedCount } = await admin()
    .from("game_sketch_drawing")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");

  const items = (data ?? []).map((d) => {
    const raw = d as Record<string, unknown>;
    return {
      id: d.id,
      status: d.status,
      word: ((raw.game_sketch_word as { text?: { ko?: string } })?.text?.ko ?? "") as string,
      strokes: d.strokes,
      duration_ms: d.duration_ms,
      ai_verdict: d.ai_verdict,
      report_count: d.report_count,
      created_at: d.created_at,
      player_hash_short: String(d.player_hash).slice(0, 8), // 식별용 축약 (개인정보 아님 — 해시)
    };
  });
  return NextResponse.json({ items, approved_total: approvedCount ?? 0 });
}

const actSchema = z.object({ id: z.string().uuid(), action: z.enum(["approve", "reject"]) });

export async function POST(req: Request) {
  if (!assertSameOrigin(req) || !requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = actSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_input" }, { status: 400 });

  const status = parsed.data.action === "approve" ? "approved" : "rejected";
  // 승인 처리 = 신고 비공개(hidden) 복구도 겸한다 (신고 오탐 판단 시)
  const { error } = await admin()
    .from("game_sketch_drawing")
    .update({ status, moderated_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .in("status", ["held", "hidden", "pending"]);
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  await logAdmin("sketch_moderate", parsed.data.id, { action: parsed.data.action });
  return NextResponse.json({ status: "ok" });
}
