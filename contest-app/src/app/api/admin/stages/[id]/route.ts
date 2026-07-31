import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { stageI18nSchema } from "@/lib/schema";
import { ARCHIVE_CATEGORY_KEYS } from "@/lib/types";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(500).optional(),
  cover_url: z.string().trim().url().max(500).nullable().optional(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  status: z.enum(["open", "archived"]).optional(),
  hidden: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  is_official: z.boolean().optional(), // 공식 아카이브(열람 전용) 토글
  category: z.enum(ARCHIVE_CATEGORY_KEYS).nullable().optional(), // D10V 아카이브 카테고리
  i18n: stageI18nSchema, // 다국어(en/ja)
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값 오류" }, { status: 400 });
  if (Object.keys(parsed.data).length === 0) return NextResponse.json({ error: "변경 내용 없음" }, { status: 400 });

  const db = admin();
  const { error } = await db.from("stages").update({ ...parsed.data, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: "수정 실패" }, { status: 500 });
  await logAdmin(db, "스테이지 수정", { targetType: "stage", targetId: id, detail: JSON.stringify(parsed.data) });
  return NextResponse.json({ ok: true });
}
