import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";

// 밸런스 계측 — 레벨 퍼널·near-miss·이탈률·이어하기·재도전 체인·판수 추이 (Wave G)
export async function GET(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const days = Math.min(90, Math.max(1, Number(new URL(req.url).searchParams.get("days")) || 7));
  const { data, error } = await admin().rpc("admin_balance_stats", { p_days: days });
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  return NextResponse.json(data ?? {});
}
