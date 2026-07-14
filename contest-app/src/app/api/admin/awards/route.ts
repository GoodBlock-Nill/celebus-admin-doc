import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { awardCreateSchema } from "@/lib/schema";

// 수상 목록 (claim_info 포함 — 서버 전용 데이터, 관리자만)
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const contestId = url.searchParams.get("contest_id");
  let q = admin().from("contest_awards").select("*").order("created_at", { ascending: false }).limit(200);
  if (contestId) q = q.eq("contest_id", contestId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  return NextResponse.json({ awards: data });
}

// 심사상 수동 등록
export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = awardCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값 오류" }, { status: 400 });
  }
  const db = admin();
  const { data: entry } = await db
    .from("contest_entries")
    .select("handle, hidden, disqualified, contest_id")
    .eq("id", parsed.data.entry_id)
    .maybeSingle();
  if (!entry || entry.contest_id !== parsed.data.contest_id) {
    return NextResponse.json({ error: "출품작을 찾을 수 없어요." }, { status: 404 });
  }
  if (entry.hidden || entry.disqualified) {
    return NextResponse.json({ error: "숨김/실격 상태의 출품작은 수상할 수 없어요." }, { status: 400 });
  }
  // 중복 수상 경고 (인기상과 중복 선정 방지)
  const { count } = await db
    .from("contest_awards")
    .select("id", { count: "exact", head: true })
    .eq("entry_id", parsed.data.entry_id);
  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: "이미 수상한 출품작이에요." }, { status: 409 });
  }
  const { data, error } = await db
    .from("contest_awards")
    .insert({
      contest_id: parsed.data.contest_id,
      entry_id: parsed.data.entry_id,
      handle: entry.handle,
      award_type: "judge",
      award_name: parsed.data.award_name,
      prize: parsed.data.prize,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: "등록 실패" }, { status: 500 });
  await logAdmin(db, "심사상 등록", {
    targetType: "award",
    targetId: data.id,
    detail: `${parsed.data.award_name} → @${entry.handle}`,
  });
  return NextResponse.json({ id: data.id });
}
