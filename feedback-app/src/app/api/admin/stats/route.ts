import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";

// KST(UTC+9) 오늘 00:00 을 UTC ISO 로
function kstTodayStartIso(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  const ms = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - 9 * 3600 * 1000;
  return new Date(ms).toISOString();
}

export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "인증이 필요해요." }, { status: 401 });
  const db = admin();
  const head = { count: "exact" as const, head: true };

  const [total, today, reported, hidden, curated, prizeTotal, shippingPending] = await Promise.all([
    db.from("posts").select("id", head),
    db.from("posts").select("id", head).gte("created_at", kstTodayStartIso()),
    db.from("posts").select("id", head).gt("report_count", 0),
    db.from("posts").select("id", head).eq("hidden", true),
    db.from("posts").select("id", head).eq("curated", true),
    db.from("prizes").select("id", head),
    db.from("prizes").select("id", head).eq("claim_status", "claimed"),
  ]);

  return NextResponse.json({
    total: total.count ?? 0,
    today: today.count ?? 0,
    reported: reported.count ?? 0,
    hidden: hidden.count ?? 0,
    curated: curated.count ?? 0,
    prizeTotal: prizeTotal.count ?? 0,
    shippingPending: shippingPending.count ?? 0,
  });
}
