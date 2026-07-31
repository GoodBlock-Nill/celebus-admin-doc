import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { stageI18nSchema } from "@/lib/schema";

const createSchema = z.object({
  stage_ids: z.array(z.string().uuid()).min(1).max(30), // 참가 아카이브(V01D=1개 / D10V=복수). [0]=대표
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
  const { stage_ids, ...rest } = parsed.data;
  // 대표(primary) 아카이브 = 첫 선택. 전체 집합은 stage_event_stages에
  const { data, error } = await db.from("stage_events").insert({ ...rest, stage_id: stage_ids[0] }).select("id").single();
  if (error || !data) return NextResponse.json({ error: "생성 실패" }, { status: 500 });
  const { error: joinErr } = await db
    .from("stage_event_stages")
    .insert(stage_ids.map((sid) => ({ event_id: data.id, stage_id: sid })));
  if (joinErr) {
    await db.from("stage_events").delete().eq("id", data.id); // 롤백
    return NextResponse.json({ error: "생성 실패" }, { status: 500 });
  }
  await logAdmin(db, "이벤트 생성", { targetType: "stage", targetId: data.id, detail: rest.title });
  return NextResponse.json({ id: data.id });
}
