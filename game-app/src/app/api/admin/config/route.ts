import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { assertSameOrigin } from "@/lib/origin";

// rewards 그룹만 스키마 검증 — 지급표 오입력이 주간 보상 지급 로직·상점 가격에 그대로 반영되는 사고 방지.
// 규칙은 AdminRewards.tsx 클라이언트 검증과 동일 유지 (여기가 최종 방어선)
const tierSchema = z
  .object({ from: z.number().int().min(1), to: z.number().int().min(1), tickets: z.number().int().min(0) })
  .refine((t) => t.from <= t.to);
const rewardsSchema = z
  .object({
    weeklyTop: z.array(z.number().int().min(0)).max(50).optional(),
    weeklyTickets: z
      .object({ tiers: z.array(tierSchema).max(20), others: z.number().int().min(0) })
      .refine((v) => {
        const s = [...v.tiers].sort((a, b) => a.from - b.from);
        return s.every((t, i) => i === 0 || t.from > s[i - 1].to); // 구간 겹침 금지
      })
      .optional(),
    ticketPrice: z.number().int().min(1).optional(),
    ticketDailyBuyCap: z.number().int().min(0).max(99).optional(),
  })
  .strict();

// missions 그룹 검증 — 미션 RPC가 이 값으로 보상을 지급하므로 오입력 방어 (AdminMissions.tsx와 규칙 동일)
const missionsSchema = z
  .object({
    count: z.number().int().min(1).max(20).optional(),
    pool: z
      .array(
        z.object({
          id: z.enum(["plays", "score", "level", "high", "item", "normal", "sketch_draw", "sketch_guess"]),
          goal: z.number().int().min(1).max(1000000),
          cp: z.number().int().min(1).max(100000),
        })
      )
      .max(20)
      .optional(),
  })
  .strict();

// game_config 오버레이 조회/저장 — 코드 기본값 위에 덮이는 관리자 튜닝 값
export async function GET(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await admin().from("game_config").select("config, updated_at").eq("id", 1).maybeSingle();
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  return NextResponse.json(data ?? { config: {} });
}

export async function PUT(req: Request) {
  if (!assertSameOrigin(req) || !requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { config?: unknown } | null;
  if (!body || typeof body.config !== "object" || body.config === null || Array.isArray(body.config)) {
    return NextResponse.json({ error: "bad_input" }, { status: 400 });
  }
  const rewards = (body.config as Record<string, unknown>).rewards;
  if (rewards !== undefined && !rewardsSchema.safeParse(rewards).success) {
    return NextResponse.json({ error: "bad_rewards" }, { status: 400 });
  }
  const missions = (body.config as Record<string, unknown>).missions;
  if (missions !== undefined && !missionsSchema.safeParse(missions).success) {
    return NextResponse.json({ error: "bad_missions" }, { status: 400 });
  }
  const { error } = await admin().from("game_config").upsert({ id: 1, config: body.config, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  await logAdmin("config_update", null, body.config);
  return NextResponse.json({ status: "ok" });
}
