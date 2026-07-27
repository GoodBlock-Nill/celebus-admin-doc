import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";

// 경제 개요 — CP 발행/소진/유통 + 발생원·사용처 분석
export async function GET(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await admin().rpc("admin_economy");
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  return NextResponse.json(data ?? {});
}
