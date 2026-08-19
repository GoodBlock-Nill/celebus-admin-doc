import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { assertSameOrigin } from "@/lib/origin";

// 가챠 이벤트·풀 관리 — digital(재화 확률형) + physical_box(실물 재고 소진형).
// digital 풀: id 보존 갱신, 제거 행은 뽑기 이력 FK로 삭제 불가 시 weight=null 아카이브(추첨·공시 제외).
// physical 풀: 게시(published) 후 구성 잠금 — 뽑기 진행 중 재고·구성 변경 차단 (기간·메모만 수정 가능).
const l10n = z.object({ ko: z.string().max(200).optional(), en: z.string().max(200).optional(), ja: z.string().max(200).optional() });
const rewardSchema = z.union([
  z.object({ cp: z.number().int().min(1).max(100000) }),
  z.object({ item: z.enum(["bomb", "line", "shuffle", "time", "heart"]), qty: z.number().int().min(1).max(99) }),
]);
const poolItemSchema = z
  .object({
    id: z.string().uuid().optional(),
    grade: z.enum(["S", "A", "B", "C", "D"]),
    prize: l10n,
    image_url: z.union([z.literal(""), z.string().url().max(500)]).optional(),
    is_physical: z.boolean().default(false),
    fulfillment: z.enum(["delivery", "mobile_ticket"]).default("delivery"), // 실물 지급 방식 — 모바일 티켓은 CELEBUS 앱 지급(주소·수령 정보 불필요)
    requires_address: z.boolean().default(false),
    reward_payload: rewardSchema.nullish(), // 실물 행은 null
    weight: z.number().int().min(1).max(1000000).nullish(), // digital 전용
    total_qty: z.number().int().min(1).max(100000).nullish(), // physical_box 전용
    per_user_cap: z.number().int().min(1).max(100).nullish(),
    sort: z.number().int().min(0).default(0),
  })
  .strict();
const eventSchema = z
  .object({
    id: z.string().uuid().optional(),
    kind: z.enum(["digital", "physical_box"]).default("digital"),
    status: z.enum(["draft", "published", "ended", "canceled"]),
    title: l10n,
    description: l10n,
    image_url: z.union([z.literal(""), z.string().url().max(500)]).optional(),
    starts_at: z.union([z.literal(""), z.string().datetime({ offset: true })]).optional(),
    ends_at: z.union([z.literal(""), z.string().datetime({ offset: true })]).optional(),
    claim_days: z.number().int().min(1).max(30).default(7),
    pool: z.array(poolItemSchema).min(1).max(30),
  })
  .strict();

// 종류별 풀 정합 — digital: weight+reward 필수 / physical_box: 수량 필수, 실물 행은 reward 없음·재화 행은 reward 필수
function poolValid(kind: "digital" | "physical_box", pool: z.infer<typeof poolItemSchema>[]): boolean {
  if (kind === "digital") return pool.every((p) => !p.is_physical && (p.weight ?? 0) >= 1 && p.reward_payload != null);
  return pool.every((p) => (p.total_qty ?? 0) >= 1 && (p.is_physical ? true : p.reward_payload != null));
}

export async function GET(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: events, error } = await admin()
    .from("game_gacha_event")
    .select("*, game_gacha_pool_item(*)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  return NextResponse.json({ events: events ?? [] });
}

export async function POST(req: Request) {
  if (!assertSameOrigin(req) || !requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = eventSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_input" }, { status: 400 });
  const { id, kind, pool, ...ev } = parsed.data;
  if (!poolValid(kind, pool)) return NextResponse.json({ error: "bad_pool" }, { status: 400 });

  const row = {
    status: ev.status,
    title: ev.title,
    description: ev.description,
    image_url: ev.image_url || null,
    starts_at: ev.starts_at || null,
    ends_at: ev.ends_at || null,
    claim_days: ev.claim_days,
    updated_at: new Date().toISOString(),
  };

  let eventId = id;
  let poolLocked = false;
  if (eventId) {
    const { data: existing } = await admin().from("game_gacha_event").select("kind, status").eq("id", eventId).maybeSingle();
    if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (existing.kind !== kind) return NextResponse.json({ error: "kind_locked" }, { status: 400 }); // 종류 변경 불가
    // 실물 이벤트는 게시 후 작성 중 회귀 금지 — 회귀 허용 시 다음 저장에서 재고(remaining)가 전체로 리셋되는 사고 방지
    if (kind === "physical_box" && existing.status !== "draft" && ev.status === "draft") {
      return NextResponse.json({ error: "status_locked" }, { status: 400 });
    }
    poolLocked = kind === "physical_box" && existing.status !== "draft"; // 게시 후 실물 풀 잠금
    const { error } = await admin().from("game_gacha_event").update(row).eq("id", eventId);
    if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  } else {
    const { data, error } = await admin().from("game_gacha_event").insert({ ...row, kind }).select("id").single();
    if (error || !data) return NextResponse.json({ error: "db" }, { status: 500 });
    eventId = data.id as string;
  }

  if (poolLocked) {
    // 게시 후에도 확률·재고에 영향 없는 필드(상품명 다국어·카드 이미지)는 수정 허용 — 기존 행 id 기준
    for (const p of pool) {
      if (!p.id) continue;
      const { error: upErr } = await admin()
        .from("game_gacha_pool_item")
        .update({ prize: p.prize, image_url: p.image_url || null })
        .eq("id", p.id)
        .eq("event_id", eventId);
      if (upErr) return NextResponse.json({ error: "db" }, { status: 500 });
    }
  }
  if (!poolLocked) {
    const { data: existing } = await admin().from("game_gacha_pool_item").select("id").eq("event_id", eventId);
    const keepIds = new Set(pool.map((p) => p.id).filter(Boolean));
    for (const rowOld of existing ?? []) {
      if (keepIds.has(rowOld.id)) continue;
      const { error: delErr } = await admin().from("game_gacha_pool_item").delete().eq("id", rowOld.id);
      if (delErr) await admin().from("game_gacha_pool_item").update({ weight: null }).eq("id", rowOld.id); // FK 보존 아카이브
    }
    for (const p of pool) {
      const item = {
        grade: p.grade,
        prize: p.prize,
        image_url: p.image_url || null,
        is_physical: kind === "physical_box" ? p.is_physical : false,
        fulfillment: p.is_physical ? p.fulfillment : "delivery",
        requires_address: p.is_physical && p.fulfillment !== "mobile_ticket" ? p.requires_address : false,
        reward_payload: p.is_physical ? null : (p.reward_payload ?? null),
        weight: kind === "digital" ? p.weight : null,
        total_qty: kind === "physical_box" ? p.total_qty : null,
        remaining_qty: kind === "physical_box" ? p.total_qty : null, // draft 저장마다 잔여 = 전체로 초기화 (게시 전만 도달 가능)
        per_user_cap: p.per_user_cap ?? null,
        sort: p.sort,
      };
      const { error: upErr } = p.id
        ? await admin().from("game_gacha_pool_item").update(item).eq("id", p.id).eq("event_id", eventId)
        : await admin().from("game_gacha_pool_item").insert({ ...item, event_id: eventId });
      if (upErr) return NextResponse.json({ error: "db" }, { status: 500 });
    }
  }

  await logAdmin("gacha_event_save", eventId, { ...parsed.data, pool_locked: poolLocked });
  return NextResponse.json({ status: "ok", id: eventId, pool_locked: poolLocked });
}
