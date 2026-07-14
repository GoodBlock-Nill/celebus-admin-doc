import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { finalizeSchema } from "@/lib/schema";

type Ctx = { params: Promise<{ id: string }> };

// 인기상 확정 — judging 상태에서 1회 snapshot
export async function POST(req: Request, { params }: Ctx) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const parsed = finalizeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값 오류" }, { status: 400 });
  }
  const db = admin();
  const { data: contest } = await db.from("contests").select("status, title").eq("id", id).maybeSingle();
  if (!contest) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (contest.status !== "judging") {
    return NextResponse.json({ error: "judging 상태에서만 인기상을 확정할 수 있어요." }, { status: 400 });
  }
  const { data: count, error } = await db.rpc("contest_finalize_popular", {
    p_contest_id: id,
    p_awards: parsed.data.awards,
  });
  if (error) return NextResponse.json({ error: "확정 실패" }, { status: 500 });
  if (count === -1) return NextResponse.json({ error: "이미 인기상이 확정된 콘테스트예요." }, { status: 409 });
  await logAdmin(db, "인기상 확정", { targetType: "contest", targetId: id, detail: `'${contest.title}' ${count}건` });
  return NextResponse.json({ count });
}
