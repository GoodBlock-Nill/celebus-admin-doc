import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";

// FanVoice와 공유하는 admin_logs에서 콘테스트 관련만
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await admin()
    .from("admin_logs")
    .select("*")
    .in("target_type", ["contest", "entry", "award"])
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  return NextResponse.json({ logs: data });
}
