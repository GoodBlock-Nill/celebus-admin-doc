import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { contestCreateSchema } from "@/lib/schema";

export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await admin().from("contests").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  return NextResponse.json({ contests: data });
}

export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = contestCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값 오류" }, { status: 400 });
  }
  const db = admin();
  const { data, error } = await db.from("contests").insert(parsed.data).select("id, slug").single();
  if (error) {
    const msg = error.code === "23505" ? "이미 사용 중인 slug예요." : "생성 실패";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  await logAdmin(db, "콘테스트 생성", { targetType: "contest", targetId: data.id, detail: parsed.data.title });
  return NextResponse.json({ id: data.id, slug: data.slug });
}
