import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";

// 출품작 목록 (숨김 포함, report_count 노출) — ?contest_id= & ?filter=reported|hidden|dq
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const contestId = url.searchParams.get("contest_id");
  const filter = url.searchParams.get("filter");

  let q = admin()
    .from("contest_entries")
    .select(
      "id, contest_id, platform, source_url, external_id, title, description, handle, handle_verified, celebus_nickname, phone, vote_count, report_count, hidden, disqualified, disqualify_reason, created_at, oembed",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (contestId) q = q.eq("contest_id", contestId);
  if (filter === "reported") q = q.gt("report_count", 0).order("report_count", { ascending: false });
  if (filter === "hidden") q = q.eq("hidden", true);
  if (filter === "dq") q = q.eq("disqualified", true);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  return NextResponse.json({ entries: data });
}
