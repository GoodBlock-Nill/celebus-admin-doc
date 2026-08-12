import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { assertSameOrigin } from "@/lib/origin";

// 가챠 이벤트·풀 관리 (Phase 3: digital 재화 가챠) — 풀은 통째 교체 저장, 변경은 전부 감사 로그.
const l10n = z.object({ ko: z.string().max(200).optional(), en: z.string().max(200).optional(), ja: z.string().max(200).optional() });
const poolItemSchema = z
  .object({
    id: z.string().uuid().optional(), // 있으면 기존 행 갱신 (뽑기 이력 FK 보존)
    grade: z.enum(["S", "A", "B", "C", "D"]),
    prize: l10n,
    image_url: z.union([z.literal(""), z.string().url().max(500)]).optional(),
    reward_payload: z.union([
      z.object({ cp: z.number().int().min(1).max(100000) }),
      z.object({ item: z.enum(["bomb", "line", "shuffle", "time", "heart"]), qty: z.number().int().min(1).max(99) }),
    ]),
    weight: z.number().int().min(1).max(1000000),
    sort: z.number().int().min(0).default(0),
  })
  .strict();
const eventSchema = z
  .object({
    id: z.string().uuid().optional(), // 있으면 수정, 없으면 생성
    status: z.enum(["draft", "published", "ended", "canceled"]),
    title: l10n,
    description: l10n,
    image_url: z.union([z.literal(""), z.string().url().max(500)]).optional(),
    starts_at: z.union([z.literal(""), z.string().datetime({ offset: true })]).optional(),
    ends_at: z.union([z.literal(""), z.string().datetime({ offset: true })]).optional(),
    pool: z.array(poolItemSchema).min(1).max(30),
  })
  .strict();

export async function GET(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: events, error } = await admin()
    .from("game_gacha_event")
    .select("*, game_gacha_pool_item(*)")
    .eq("kind", "digital")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  return NextResponse.json({ events: events ?? [] });
}

export async function POST(req: Request) {
  if (!assertSameOrigin(req) || !requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = eventSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_input" }, { status: 400 });
  const { id, pool, ...ev } = parsed.data;
  const row = {
    kind: "digital",
    status: ev.status,
    title: ev.title,
    description: ev.description,
    image_url: ev.image_url || null,
    starts_at: ev.starts_at || null,
    ends_at: ev.ends_at || null,
    updated_at: new Date().toISOString(),
  };

  let eventId = id;
  if (eventId) {
    const { error } = await admin().from("game_gacha_event").update(row).eq("id", eventId).eq("kind", "digital");
    if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  } else {
    const { data, error } = await admin().from("game_gacha_event").insert(row).select("id").single();
    if (error || !data) return NextResponse.json({ error: "db" }, { status: 500 });
    eventId = data.id as string;
  }

  // 풀 저장 — id 있는 행은 갱신, 없는 행은 추가. 폼에서 제거된 행은 삭제 시도 후
  // 뽑기 이력 FK로 삭제 불가하면 weight=null 아카이브(추첨·공시 자동 제외 — 공개 뷰 필터와 세트)
  const { data: existing } = await admin().from("game_gacha_pool_item").select("id").eq("event_id", eventId);
  const keepIds = new Set(pool.map((p) => p.id).filter(Boolean));
  for (const row of existing ?? []) {
    if (keepIds.has(row.id)) continue;
    const { error: delErr } = await admin().from("game_gacha_pool_item").delete().eq("id", row.id);
    if (delErr) await admin().from("game_gacha_pool_item").update({ weight: null }).eq("id", row.id);
  }
  for (const p of pool) {
    const item = { grade: p.grade, prize: p.prize, image_url: p.image_url || null, reward_payload: p.reward_payload, weight: p.weight, sort: p.sort };
    const { error: upErr } = p.id
      ? await admin().from("game_gacha_pool_item").update(item).eq("id", p.id).eq("event_id", eventId)
      : await admin().from("game_gacha_pool_item").insert({ ...item, event_id: eventId });
    if (upErr) return NextResponse.json({ error: "db" }, { status: 500 });
  }

  await logAdmin("gacha_event_save", eventId, parsed.data);
  return NextResponse.json({ status: "ok", id: eventId });
}
