import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";

const COLS = "id, target, category, title, nickname, body, like_count, report_count, hidden, created_at, curated, pinned, impl_status, official_reply";
const PAGE = 20;

// 검색·필터·정렬·페이지네이션
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().replace(/[%,()\\]/g, "").slice(0, 50);
  const status = url.searchParams.get("status") ?? "all";
  const target = url.searchParams.get("target") ?? "all";
  const category = url.searchParams.get("category") ?? "all";
  const sort = url.searchParams.get("sort") ?? "recent";
  const page = Math.max(0, Number(url.searchParams.get("page") ?? "0") || 0);

  let query = admin().from("posts").select(COLS, { count: "exact" });

  if (target !== "all") query = query.eq("target", target);
  if (category !== "all") query = query.eq("category", category);
  if (status === "reported") query = query.gt("report_count", 0);
  else if (status === "hidden") query = query.eq("hidden", true);
  else if (status === "curated") query = query.eq("curated", true);
  else if (status === "pinned") query = query.eq("pinned", true);
  else if (status === "candidates") query = query.eq("curated", false).eq("hidden", false);
  if (q) query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%,nickname.ilike.%${q}%`);

  if (sort === "reported" || status === "reported") query = query.order("report_count", { ascending: false }).order("created_at", { ascending: false });
  else if (sort === "likes" || status === "candidates") query = query.order("like_count", { ascending: false }).order("created_at", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data, count, error } = await query.range(page * PAGE, page * PAGE + PAGE - 1);
  if (error) return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  return NextResponse.json({ posts: data ?? [], count: count ?? 0, size: PAGE });
}
