import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";

const PAGE = 100;

// 활동 로그 — 페이지네이션(offset) + 전체 건수. 대상 계정은 닉네임 조인, actor로 관리자/시스템 구분.
export async function GET(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const offset = Math.max(0, parseInt(new URL(req.url).searchParams.get("offset") ?? "0", 10) || 0);

  const [{ data, error }, { count }] = await Promise.all([
    admin().rpc("admin_logs", { p_limit: PAGE, p_offset: offset }),
    admin().from("game_admin_log").select("action", { count: "exact", head: true }),
  ]);
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  return NextResponse.json({ rows: data ?? [], total: count ?? 0, page: PAGE });
}
