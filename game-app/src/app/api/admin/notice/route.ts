import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { assertSameOrigin } from "@/lib/origin";

// 홈 팝업 공지 관리 — 목록(비활성·예약 포함) / 저장(upsert) / 삭제

const l10n = (max: number) =>
  z.object({ ko: z.string().trim().max(max).optional(), en: z.string().trim().max(max).optional(), ja: z.string().trim().max(max).optional() });
const urlField = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || v.startsWith("https://") || v.startsWith("/"), "https:// 또는 / 로 시작해야 해요")
  .nullish(); // null(없음)·undefined 모두 허용

const noticeSchema = z
  .object({
    id: z.string().uuid().optional(),
    enabled: z.boolean(),
    sort: z.number().int().min(0).max(9999),
    title: l10n(80).refine((t) => (t.ko ?? "").length > 0, "한국어 제목은 필수예요"),
    body: l10n(600),
    image_url: urlField,
    cta_label: l10n(30),
    cta_url: urlField,
    policy: z.enum(["always", "daily", "once"]),
    starts_at: z.string().datetime({ offset: true }).nullable(),
    ends_at: z.string().datetime({ offset: true }).nullable(),
  })
  .refine((n) => !n.starts_at || !n.ends_at || n.starts_at < n.ends_at, { message: "종료가 시작보다 빨라요" });

export async function GET(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await admin().from("game_notice").select("*").order("sort").order("created_at");
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  if (!assertSameOrigin(req) || !requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = noticeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_input", detail: parsed.error.issues[0]?.message ?? "" }, { status: 400 });
  }
  const n = parsed.data;
  const row = {
    ...(n.id ? { id: n.id } : {}),
    enabled: n.enabled,
    sort: n.sort,
    title: n.title,
    body: n.body,
    image_url: n.image_url || null,
    cta_label: n.cta_label,
    cta_url: n.cta_url || null,
    policy: n.policy,
    starts_at: n.starts_at,
    ends_at: n.ends_at,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await admin().from("game_notice").upsert(row).select("id").single();
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  await logAdmin("notice_save", data.id, { title: n.title.ko, enabled: n.enabled, policy: n.policy });
  return NextResponse.json({ status: "ok", id: data.id });
}

export async function DELETE(req: Request) {
  if (!assertSameOrigin(req) || !requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) return NextResponse.json({ error: "bad_input" }, { status: 400 });
  const { error } = await admin().from("game_notice").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  await logAdmin("notice_delete", id, null);
  return NextResponse.json({ status: "ok" });
}
