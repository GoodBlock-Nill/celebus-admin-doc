import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";

type Ctx = { params: Promise<{ id: string }> };

// 최근 24시간 득표 급상승 TOP N — 집계 결과만 노출 (votes 테이블은 서버 전용)
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const { data, error } = await admin().rpc("contest_trending_entries", {
    p_contest_id: id,
    p_hours: 24,
    p_limit: 5,
  });
  if (error) return NextResponse.json({ error: "조회 중 오류가 발생했어요." }, { status: 500 });
  return NextResponse.json({ trending: data ?? [] });
}
