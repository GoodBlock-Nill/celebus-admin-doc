import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";

type Ctx = { params: Promise<{ id: string }> };

// 종료된 콘테스트의 출품자 전화번호 일괄 파기
export async function POST(req: Request, { params }: Ctx) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const db = admin();
  const { data: contest } = await db.from("contests").select("status, title").eq("id", id).maybeSingle();
  if (!contest) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (contest.status !== "closed") {
    return NextResponse.json({ error: "종료(closed)된 콘테스트만 파기할 수 있어요." }, { status: 400 });
  }
  const { data: count, error } = await db.rpc("contest_purge_entry_pii", { p_contest_id: id });
  if (error) return NextResponse.json({ error: "파기 실패" }, { status: 500 });
  await logAdmin(db, "출품자 전화번호 파기", { targetType: "contest", targetId: id, detail: `'${contest.title}' ${count}건` });
  return NextResponse.json({ count });
}
