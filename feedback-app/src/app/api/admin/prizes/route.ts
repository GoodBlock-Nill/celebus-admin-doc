import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";
import { prizeCreateSchema } from "@/lib/schema";
import { logAdmin } from "@/lib/admin-log";

// 발표/당첨자 목록 (배송정보 포함 — 관리자만)
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
  const { data, error } = await admin()
    .from("prizes")
    .select("*")
    .order("round", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  return NextResponse.json({ prizes: data ?? [] });
}

// 채택-굿즈 수동 등록 (type=curated)
export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
  const parsed = prizeCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "입력값을 확인해주세요." }, { status: 400 });

  const db = admin();
  const { error } = await db.from("prizes").insert({ ...parsed.data, type: "curated" });
  if (error) return NextResponse.json({ error: "등록 실패" }, { status: 500 });
  await logAdmin(db, "prize_create", { targetType: "prize", targetId: parsed.data.post_id, detail: `채택 굿즈 등록 · ${parsed.data.prize}` });
  return NextResponse.json({ ok: true });
}
