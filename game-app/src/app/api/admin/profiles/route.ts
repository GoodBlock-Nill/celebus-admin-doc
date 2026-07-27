import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";

const PAGE = 50;
const FILTERS = new Set(["all", "member", "flagged"]);

// 회원 목록 — 검색(닉네임 부분일치) + 필터(전체/멤버/의심) + 페이지네이션 + 필터 반영 총건수.
export async function GET(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") ?? "").slice(0, 40);
  const filter = FILTERS.has(sp.get("filter") ?? "") ? sp.get("filter")! : "all";
  const offset = Math.max(0, parseInt(sp.get("offset") ?? "0", 10) || 0);

  const { data, error } = await admin().rpc("admin_members", { p_q: q, p_filter: filter, p_limit: PAGE, p_offset: offset });
  if (error) return NextResponse.json({ error: "rpc" }, { status: 500 });
  return NextResponse.json({ rows: data?.rows ?? [], total: data?.total ?? 0, page: PAGE });
}
