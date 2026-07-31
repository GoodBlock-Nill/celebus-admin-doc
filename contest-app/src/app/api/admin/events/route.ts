import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { stageI18nSchema } from "@/lib/schema";

const createSchema = z.object({
  stage_id: z.string().uuid(),
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).default(""),
  ends_at: z.string().datetime({ offset: true }).nullable().optional(),
  reward_type: z.enum(["reward", "popularity"]).default("popularity"),
  reward: z.string().trim().max(200).default(""),
  category: z.string().trim().max(40).nullable().optional(),
  cover_url: z.string().trim().url().nullable().optional(),
  i18n: stageI18nSchema, // 다국어(en/ja) title·description
});

// 월드컵 이벤트 관리 — 스테이지 단위로 개최
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await admin()
    .from("stage_events")
    .select("*, stages(title)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  return NextResponse.json({ events: data });
}

export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값 오류" }, { status: 400 });

  const db = admin();
  const { data, error } = await db.from("stage_events").insert(parsed.data).select("id").single();
  if (error || !data) return NextResponse.json({ error: "생성 실패" }, { status: 500 });
  await logAdmin(db, "이벤트 생성", { targetType: "stage", targetId: data.id, detail: parsed.data.title });
  return NextResponse.json({ id: data.id });
}
