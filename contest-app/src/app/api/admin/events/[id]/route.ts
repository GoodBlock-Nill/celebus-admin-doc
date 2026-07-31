import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { stageI18nSchema } from "@/lib/schema";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(500).optional(),
  ends_at: z.string().datetime({ offset: true }).nullable().optional(),
  status: z.enum(["open", "announced", "closed"]).optional(),
  reward_type: z.enum(["reward", "popularity"]).optional(),
  reward: z.string().trim().max(200).optional(),
  i18n: stageI18nSchema, // 다국어(en/ja)
  cover_url: z.string().trim().url().nullable().optional(),
});

type StatRow = { post_id: string; runs_appeared: number; final_wins: number; match_wins: number; match_losses: number };

// 발표(announced) 전환 시 3종 수상 자동 계산 — 팬인기상(우승 비율)·아티스트인기상(멤버 픽)·최다업로드상(유효 업로드 일수)
// category 지정 시 해당 카테고리 영상만 대상. 공식영상 토너먼트(isOfficial)는 최다업로드상 제외(업로더가 단일).
async function computeAwards(eventId: string, stageId: string, category: string | null, isOfficial: boolean) {
  const db = admin();
  let postsQ = db.from("stage_posts").select("id, title, handle, owner_id, created_at").eq("stage_id", stageId).eq("hidden", false);
  if (category) postsQ = postsQ.eq("category", category);
  const [statsRes, picksRes, postsRes] = await Promise.all([
    db.from("worldcup_stats").select("post_id, runs_appeared, final_wins, match_wins, match_losses").eq("event_id", eventId),
    db.from("member_event_picks").select("post_id").eq("event_id", eventId),
    postsQ,
  ]);
  const posts = new Map((postsRes.data ?? []).map((p) => [p.id as string, p]));

  // 팬인기상 — 우승 비율 1위 (동률 시 승률)
  const stats = ((statsRes.data ?? []) as StatRow[]).filter((s) => s.runs_appeared > 0);
  stats.sort((a, b) => {
    const wa = a.final_wins / a.runs_appeared, wb = b.final_wins / b.runs_appeared;
    if (wb !== wa) return wb - wa;
    const ma = a.match_wins / Math.max(1, a.match_wins + a.match_losses);
    const mb = b.match_wins / Math.max(1, b.match_wins + b.match_losses);
    return mb - ma;
  });
  const fanTop = stats[0] ? posts.get(stats[0].post_id) : null;

  // 아티스트인기상 — 멤버 픽 최다
  const pickCount = new Map<string, number>();
  for (const p of picksRes.data ?? []) pickCount.set(p.post_id as string, (pickCount.get(p.post_id as string) ?? 0) + 1);
  const artistTopId = [...pickCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const artistTop = artistTopId ? posts.get(artistTopId) : null;

  // 최다업로드상 — 유효 업로드 일수(1일 1건 인정) 최다 소유자 (표시는 핸들)
  const days = new Map<string, { handle: string; set: Set<string> }>();
  for (const p of postsRes.data ?? []) {
    const key = p.owner_id as string;
    const day = String(p.created_at).slice(0, 10);
    const e = days.get(key) ?? { handle: p.handle as string, set: new Set<string>() };
    e.set.add(day);
    days.set(key, e);
  }
  const uploaderTop = [...days.values()].sort((a, b) => b.set.size - a.set.size)[0];

  return {
    fan: fanTop ? { post_id: fanTop.id, title: fanTop.title, handle: fanTop.handle } : null,
    artist: artistTop ? { post_id: artistTop.id, title: artistTop.title, handle: artistTop.handle, picks: pickCount.get(artistTopId!) ?? 0 } : null,
    // 공식영상 토너먼트는 업로더가 단일(@v01d-ix)이라 최다업로드상 미부여
    uploader: !isOfficial && uploaderTop ? { handle: uploaderTop.handle, days: uploaderTop.set.size } : null,
  };
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값 오류" }, { status: 400 });
  if (Object.keys(parsed.data).length === 0) return NextResponse.json({ error: "변경 내용 없음" }, { status: 400 });

  const db = admin();
  const update: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() };

  // 발표 전환 → 수상 계산·저장
  if (parsed.data.status === "announced") {
    const { data: ev } = await db
      .from("stage_events")
      .select("stage_id, category, stages(is_official)")
      .eq("id", id)
      .maybeSingle();
    if (!ev) return NextResponse.json({ error: "이벤트 없음" }, { status: 404 });
    const isOfficial = Boolean((ev.stages as { is_official?: boolean } | null)?.is_official);
    update.awards = await computeAwards(id, ev.stage_id as string, (ev.category as string | null) ?? null, isOfficial);
  }

  const { error } = await db.from("stage_events").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: "수정 실패" }, { status: 500 });
  await logAdmin(db, "이벤트 수정", { targetType: "stage", targetId: id, detail: JSON.stringify(parsed.data) });
  return NextResponse.json({ ok: true });
}
