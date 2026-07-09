import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";

type Ctx = { params: Promise<{ id: string }> };

// 숨김/해제 · 베스트 고정/해제
export async function PATCH(req: Request, { params }: Ctx) {
  if (!isAdmin(req)) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const patch: { hidden?: boolean; pinned?: boolean } = {};
  if (typeof body?.hidden === "boolean") patch.hidden = body.hidden;
  if (typeof body?.pinned === "boolean") patch.pinned = body.pinned;
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "변경할 값이 없어요." }, { status: 400 });

  const db = admin();
  const { error } = await db.from("comments").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: "처리 실패" }, { status: 500 });
  const action = "hidden" in patch ? (patch.hidden ? "hide" : "unhide") : patch.pinned ? "pin" : "unpin";
  const detail = "hidden" in patch ? (patch.hidden ? "댓글 숨김" : "댓글 숨김 해제") : patch.pinned ? "댓글 베스트 고정" : "댓글 고정 해제";
  await logAdmin(db, action, { targetType: "post", targetId: id, detail });
  return NextResponse.json({ ok: true });
}

// 댓글 삭제
export async function DELETE(req: Request, { params }: Ctx) {
  if (!isAdmin(req)) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
  const { id } = await params;
  const db = admin();
  const { error } = await db.from("comments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  await logAdmin(db, "delete", { targetType: "post", targetId: id, detail: "댓글 삭제" });
  return NextResponse.json({ ok: true });
}
