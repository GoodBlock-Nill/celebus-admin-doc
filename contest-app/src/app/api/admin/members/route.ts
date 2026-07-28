import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";

const createSchema = z.object({
  user_id: z.string().trim().min(8).max(80),     // 신원 식별자 (개발 기간: 익명 id / W4: SSO 계정 id)
  display_name: z.string().trim().min(1).max(30),
  avatar_url: z.string().trim().url().max(500).nullable().optional(),
});

// 멤버(아티스트) 계정 관리 — 하트·멤버 댓글 권한의 원천. 개발 기간 테스트 신원 등록용.
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await admin().from("stage_members").select("*").order("sort_order").order("created_at");
  if (error) return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  return NextResponse.json({ members: data });
}

export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값 오류" }, { status: 400 });

  const db = admin();
  const { error } = await db.from("stage_members").upsert(parsed.data);
  if (error) return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  await logAdmin(db, "멤버 등록", { targetType: "stage", detail: parsed.data.display_name });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = new URL(req.url).searchParams.get("user_id") ?? "";
  if (userId.length < 8) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  const db = admin();
  const { error } = await db.from("stage_members").delete().eq("user_id", userId);
  if (error) return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  await logAdmin(db, "멤버 해제", { targetType: "stage", detail: userId.slice(0, 12) });
  return NextResponse.json({ ok: true });
}
