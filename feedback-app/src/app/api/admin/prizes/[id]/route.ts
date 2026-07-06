import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";

type Ctx = { params: Promise<{ id: string }> };

// 발송 상태 변경 (none / claimed / shipped)
export async function PATCH(req: Request, { params }: Ctx) {
  if (!isAdmin(req)) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const status = body?.claim_status;
  if (!["none", "claimed", "shipped"].includes(status)) {
    return NextResponse.json({ error: "잘못된 상태" }, { status: 400 });
  }
  const db = admin();
  const { error } = await db.from("prizes").update({ claim_status: status }).eq("id", id);
  if (error) return NextResponse.json({ error: "처리 실패" }, { status: 500 });
  if (status === "shipped") await logAdmin(db, "prize_ship", { targetType: "prize", targetId: id, detail: "발송완료 처리" });
  return NextResponse.json({ ok: true });
}

// 발표 삭제 (오등록 정리)
export async function DELETE(req: Request, { params }: Ctx) {
  if (!isAdmin(req)) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
  const { id } = await params;
  const db = admin();
  const { error } = await db.from("prizes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  await logAdmin(db, "prize_delete", { targetType: "prize", targetId: id, detail: "발표 삭제" });
  return NextResponse.json({ ok: true });
}
