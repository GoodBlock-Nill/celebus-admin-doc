import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";

const COLS = "id, post_id, nickname, body, like_count, report_count, hidden, is_op, pinned, created_at";
const PAGE = 20;

// 댓글 모더레이션 목록 — 검색·상태 필터·정렬·페이지
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().replace(/[%,()\\]/g, "").slice(0, 50);
  const status = url.searchParams.get("status") ?? "all";
  const sort = url.searchParams.get("sort") ?? "recent";
  const page = Math.max(0, Number(url.searchParams.get("page") ?? "0") || 0);

  let query = admin().from("comments").select(COLS, { count: "exact" });

  if (status === "reported") query = query.gt("report_count", 0);
  else if (status === "hidden") query = query.eq("hidden", true);
  else if (status === "pinned") query = query.eq("pinned", true);
  if (q) query = query.or(`body.ilike.%${q}%,nickname.ilike.%${q}%`);

  if (sort === "reported" || status === "reported") query = query.order("report_count", { ascending: false }).order("created_at", { ascending: false });
  else if (sort === "likes") query = query.order("like_count", { ascending: false }).order("created_at", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data, count, error } = await query.range(page * PAGE, page * PAGE + PAGE - 1);
  if (error) return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  return NextResponse.json({ comments: data ?? [], count: count ?? 0, size: PAGE });
}
