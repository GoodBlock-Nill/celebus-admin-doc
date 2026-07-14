import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { contestPatchSchema } from "@/lib/schema";
import type { ContestStatus } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

// 상태 머신 — 허용 전환만 (역방향은 open→draft, 출품 0건일 때만)
const TRANSITIONS: Record<ContestStatus, ContestStatus[]> = {
  draft: ["open"],
  open: ["voting", "judging", "draft"],
  voting: ["judging"],
  judging: ["announced"],
  announced: ["closed"],
  closed: [],
};

export async function PATCH(req: Request, { params }: Ctx) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const parsed = contestPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값 오류" }, { status: 400 });
  }
  const db = admin();
  const patch = parsed.data;

  if (patch.status) {
    const { data: cur } = await db.from("contests").select("status, title").eq("id", id).maybeSingle();
    if (!cur) return NextResponse.json({ error: "not found" }, { status: 404 });
    const from = cur.status as ContestStatus;
    if (!TRANSITIONS[from].includes(patch.status)) {
      return NextResponse.json({ error: `'${from}' → '${patch.status}' 전환은 허용되지 않아요.` }, { status: 400 });
    }
    if (from === "open" && patch.status === "draft") {
      const { count } = await db
        .from("contest_entries")
        .select("id", { count: "exact", head: true })
        .eq("contest_id", id);
      if ((count ?? 0) > 0) {
        return NextResponse.json({ error: "출품작이 있는 콘테스트는 draft로 되돌릴 수 없어요." }, { status: 400 });
      }
    }
    await logAdmin(db, "콘테스트 상태 전환", {
      targetType: "contest",
      targetId: id,
      detail: `'${cur.title}' ${from} → ${patch.status}`,
    });
  }

  const { error } = await db
    .from("contests")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: "수정 실패" }, { status: 500 });
  if (!patch.status) {
    await logAdmin(db, "콘테스트 수정", { targetType: "contest", targetId: id, detail: Object.keys(patch).join(",") });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Ctx) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const db = admin();
  const { data: cur } = await db.from("contests").select("status, title").eq("id", id).maybeSingle();
  if (!cur) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (cur.status !== "draft") {
    return NextResponse.json({ error: "draft 상태의 콘테스트만 삭제할 수 있어요." }, { status: 400 });
  }
  const { error } = await db.from("contests").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  await logAdmin(db, "콘테스트 삭제", { targetType: "contest", targetId: id, detail: cur.title });
  return NextResponse.json({ ok: true });
}
