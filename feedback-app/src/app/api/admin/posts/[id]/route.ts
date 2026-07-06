import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";
import { adminPatchSchema } from "@/lib/schema";
import { logAdmin } from "@/lib/admin-log";

type Ctx = { params: Promise<{ id: string }> };

const STATUS_LABEL: Record<string, string> = { none: "상태없음", reviewing: "검토중", planned: "반영예정", realized: "실현됨" };

// 사람이 읽는 액션 요약
function describe(patch: Record<string, unknown>): { action: string; detail: string } {
  if ("hidden" in patch) return { action: patch.hidden ? "hide" : "unhide", detail: patch.hidden ? "숨김" : "숨김 해제" };
  if ("curated" in patch) return { action: "curate", detail: patch.curated ? "채택 ON" : "채택 OFF" };
  if ("pinned" in patch) return { action: "pin", detail: patch.pinned ? "고정 ON" : "고정 OFF" };
  if ("impl_status" in patch) return { action: "status", detail: `실현상태=${STATUS_LABEL[String(patch.impl_status)] ?? patch.impl_status}` };
  if ("official_reply" in patch) return { action: "reply", detail: patch.official_reply ? "공식답글 저장" : "공식답글 삭제" };
  return { action: "update", detail: "수정" };
}

// 숨김/해제 · 채택 · 고정 · 실현상태 · 공식답글 (온 필드만 부분 갱신)
export async function PATCH(req: Request, { params }: Ctx) {
  if (!isAdmin(req)) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
  const { id } = await params;
  const parsed = adminPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });

  const patch = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined));
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "변경할 값이 없어요." }, { status: 400 });

  const db = admin();
  const { error } = await db.from("posts").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: "처리 실패" }, { status: 500 });
  const { action, detail } = describe(patch);
  await logAdmin(db, action, { targetType: "post", targetId: id, detail });
  return NextResponse.json({ ok: true });
}

// 완전 삭제
export async function DELETE(req: Request, { params }: Ctx) {
  if (!isAdmin(req)) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
  const { id } = await params;
  const db = admin();
  const { error } = await db.from("posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  await logAdmin(db, "delete", { targetType: "post", targetId: id, detail: "글 삭제" });
  return NextResponse.json({ ok: true });
}
