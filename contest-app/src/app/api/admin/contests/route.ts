import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { contestCreateSchema } from "@/lib/schema";
import { deriveSlug } from "@/lib/slug";

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
  const manualSlug = parsed.data.slug; // 관리자가 직접 입력한 slug (고급)
  let lastCode: string | undefined;
  // slug 미제공 시 자동 생성 + 유니크 충돌 재시도
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = manualSlug || deriveSlug(parsed.data.artist ?? "V01D", parsed.data.contest_type);
    const { data, error } = await db
      .from("contests")
      .insert({ ...parsed.data, slug })
      .select("id, slug")
      .single();
    if (!error) {
      await logAdmin(db, "콘테스트 생성", { targetType: "contest", targetId: data.id, detail: parsed.data.title });
      return NextResponse.json({ id: data.id, slug: data.slug });
    }
    lastCode = error.code;
    if (error.code === "23505" && !manualSlug) continue; // 자동 slug 충돌 → 재생성
    break; // 수동 slug 충돌 또는 기타 에러
  }
  const msg = lastCode === "23505" ? "이미 사용 중인 slug예요." : "생성 실패";
  return NextResponse.json({ error: msg }, { status: 400 });
}
