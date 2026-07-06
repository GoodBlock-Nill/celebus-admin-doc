import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";

export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
  // admin_logs 테이블이 아직 없으면(005 미실행) 빈 목록으로 관대하게 처리
  const { data, error } = await admin().from("admin_logs").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) return NextResponse.json({ logs: [] });
  return NextResponse.json({ logs: data ?? [] });
}
