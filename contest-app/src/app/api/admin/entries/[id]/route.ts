import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { entryAdminPatchSchema } from "@/lib/schema";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const parsed = entryAdminPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "입력값 오류" }, { status: 400 });

  const db = admin();
  const { error } = await db.from("contest_entries").update(parsed.data).eq("id", id);
  if (error) return NextResponse.json({ error: "수정 실패" }, { status: 500 });

  const acts: string[] = [];
  if (parsed.data.hidden !== undefined) acts.push(parsed.data.hidden ? "숨김" : "숨김 해제");
  if (parsed.data.disqualified !== undefined)
    acts.push(parsed.data.disqualified ? `실격(${parsed.data.disqualify_reason ?? "-"})` : "실격 해제");
  await logAdmin(db, `출품작 ${acts.join("·") || "수정"}`, { targetType: "entry", targetId: id });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Ctx) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const db = admin();
  // 수상 엔트리 삭제 차단 — award가 고아화되면 클레임이 영구 실패하는데 UI엔 '수령 가능'으로 남음
  const { count } = await db
    .from("contest_awards")
    .select("id", { count: "exact", head: true })
    .eq("entry_id", id);
  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "수상한 출품작은 삭제할 수 없어요. 먼저 수상을 취소하거나 숨김 처리해주세요." },
      { status: 400 },
    );
  }
  const { error } = await db.from("contest_entries").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  await logAdmin(db, "출품작 완전 삭제", { targetType: "entry", targetId: id });
  return NextResponse.json({ ok: true });
}
