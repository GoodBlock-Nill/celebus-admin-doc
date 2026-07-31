import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { stageI18nSchema } from "@/lib/schema";

const createSchema = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).default(""),
  cover_url: z.string().trim().url().max(500).nullable().optional(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  is_official: z.boolean().optional().default(false), // 공식 아카이브(열람 전용)
  i18n: stageI18nSchema, // 다국어(en/ja) title·description
});

// 스테이지(공연 컨테이너) 관리 — contests와 동일 패턴(service_role 직접)
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await admin().from("stages").select("*").order("sort_order").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  return NextResponse.json({ stages: data });
}

export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값 오류" }, { status: 400 });

  const db = admin();
  const { data, error } = await db.from("stages").insert(parsed.data).select("id").single();
  if (error || !data) return NextResponse.json({ error: "생성 실패" }, { status: 500 });
  await logAdmin(db, "스테이지 생성", { targetType: "stage", targetId: data.id, detail: parsed.data.title });
  return NextResponse.json({ id: data.id });
}
