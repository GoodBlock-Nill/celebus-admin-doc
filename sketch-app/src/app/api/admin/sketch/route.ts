import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { assertSameOrigin } from "@/lib/origin";

// 스케치 검수·신고 처리 (관리자) — 보류(held)·신고 비공개(hidden)·판정 전(pending) + 자동 반려(rejected) 감사.
// P0: rejected도 큐에 노출 — AI 단독 반려는 반드시 사후 감사 가능해야 한다 (오탐 복구 채널).
// P1: 판정 품질 지표(최근 7일 approve/hold/reject율 + AI 미탐) — 프롬프트를 언제 손볼지 알려주는 신호.
export async function GET(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const [queue, rejected, approvedTotal, recent, missed] = await Promise.all([
    admin()
      .from("game_sketch_drawing")
      .select("id, player_hash, strokes, duration_ms, status, ai_verdict, report_count, thumb_url, created_at, game_sketch_word(text)")
      .in("status", ["held", "hidden", "pending"])
      .order("created_at", { ascending: true })
      .limit(100),
    // 자동 반려 감사 — 최근 것부터 (수동 처리분 제외 = moderated_at 없음)
    admin()
      .from("game_sketch_drawing")
      .select("id, player_hash, strokes, duration_ms, status, ai_verdict, report_count, thumb_url, created_at, game_sketch_word(text)")
      .eq("status", "rejected")
      .is("moderated_at", null)
      .order("created_at", { ascending: false })
      .limit(30),
    admin().from("game_sketch_drawing").select("id", { count: "exact", head: true }).eq("status", "approved"),
    admin().from("game_sketch_drawing").select("ai_verdict").gte("created_at", weekAgo).limit(1000),
    // AI 미탐 = AI가 승인했는데 신고 임계로 비공개된 그림
    admin()
      .from("game_sketch_drawing")
      .select("id", { count: "exact", head: true })
      .eq("status", "hidden")
      .eq("ai_verdict->>action", "approve"),
  ]);
  if (queue.error || rejected.error) return NextResponse.json({ error: "db" }, { status: 500 });

  const verdicts = (recent.data ?? []).map((d) => (d.ai_verdict as { action?: string } | null)?.action).filter(Boolean);
  const count = (a: string) => verdicts.filter((v) => v === a).length;

  const shape = (rows: typeof queue.data) =>
    (rows ?? []).map((d) => {
      const raw = d as Record<string, unknown>;
      return {
        id: d.id,
        status: d.status,
        word: ((raw.game_sketch_word as { text?: { ko?: string } })?.text?.ko ?? "") as string,
        strokes: d.strokes,
        duration_ms: d.duration_ms,
        ai_verdict: d.ai_verdict,
        report_count: d.report_count,
        thumb_url: d.thumb_url,
        created_at: d.created_at,
        player_hash_short: String(d.player_hash).slice(0, 8),
      };
    });

  return NextResponse.json({
    items: shape(queue.data),
    rejected: shape(rejected.data),
    approved_total: approvedTotal.count ?? 0,
    metrics: {
      week_total: verdicts.length,
      approve: count("approve"),
      hold: count("hold"),
      reject: count("reject"),
      ai_missed: missed.count ?? 0, // AI 승인 → 신고 비공개 (프롬프트 개선 신호)
    },
  });
}

const actSchema = z.object({ id: z.string().uuid(), action: z.enum(["approve", "reject"]) });

export async function POST(req: Request) {
  if (!assertSameOrigin(req) || !requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = actSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_input" }, { status: 400 });

  const status = parsed.data.action === "approve" ? "approved" : "rejected";
  // 승인 = 보류 해제·신고 오탐 복구·AI 반려 뒤집기 모두 겸한다
  const { error } = await admin()
    .from("game_sketch_drawing")
    .update({ status, moderated_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .in("status", ["held", "hidden", "pending", "rejected"]);
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  await logAdmin("sketch_moderate", parsed.data.id, { action: parsed.data.action });
  return NextResponse.json({ status: "ok" });
}
