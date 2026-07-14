import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { awardPatchSchema } from "@/lib/schema";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const parsed = awardPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "입력값 오류" }, { status: 400 });

  const db = admin();
  const patch: Record<string, unknown> = {};
  const acts: string[] = [];
  if (parsed.data.claim_status) {
    patch.claim_status = parsed.data.claim_status;
    if (parsed.data.claim_status === "shipped") patch.shipped_at = new Date().toISOString();
    acts.push(`배송상태 ${parsed.data.claim_status}`);
  }
  if (parsed.data.purge_claim_info) {
    patch.claim_info = null;
    acts.push("배송정보 파기");
  }
  if (!Object.keys(patch).length) return NextResponse.json({ error: "변경 사항 없음" }, { status: 400 });

  const { error } = await db.from("contest_awards").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: "수정 실패" }, { status: 500 });
  await logAdmin(db, `수상 ${acts.join("·")}`, { targetType: "award", targetId: id });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Ctx) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const db = admin();
  const { error } = await db.from("contest_awards").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  await logAdmin(db, "수상 취소", { targetType: "award", targetId: id });
  return NextResponse.json({ ok: true });
}
