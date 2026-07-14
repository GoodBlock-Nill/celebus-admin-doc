import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";

export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = admin();

  const [contests, entries, votes, claims, reported] = await Promise.all([
    db.from("contests").select("id, title, slug, status, contest_type", { count: "exact" }),
    db.from("contest_entries").select("id", { count: "exact", head: true }),
    db.from("contest_votes").select("entry_id", { count: "exact", head: true }),
    db.from("contest_awards").select("id", { count: "exact", head: true }).eq("claim_status", "claimed"),
    db.from("contest_entries").select("id", { count: "exact", head: true }).gt("report_count", 0),
  ]);

  return NextResponse.json({
    contests: contests.data ?? [],
    contestCount: contests.count ?? 0,
    entryCount: entries.count ?? 0,
    voteCount: votes.count ?? 0,
    pendingClaims: claims.count ?? 0,
    reportedEntries: reported.count ?? 0,
  });
}
