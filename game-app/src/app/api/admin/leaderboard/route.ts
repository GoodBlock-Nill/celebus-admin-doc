import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";

const PRESETS = new Set(["this_week", "last_week", "this_month", "last_month", "all"]);

export async function GET(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") === "free" ? "free" : "daily";
  // period+offset = 임의 과거 기간(오프셋 열람), 없으면 preset(기존)
  const period = url.searchParams.get("period");
  const offset = Math.min(52, Math.max(0, Number(url.searchParams.get("offset")) || 0));
  if ((period === "week" || period === "month") && offset > 0) {
    const { data, error } = await admin().rpc("admin_leaderboard_at", { p_mode: mode, p_period: period, p_offset: offset, p_limit: 200 });
    if (error) return NextResponse.json({ error: "rpc" }, { status: 500 });
    return NextResponse.json(data ?? []);
  }
  const preset = url.searchParams.get("preset") ?? "all";
  if (!PRESETS.has(preset)) return NextResponse.json({ error: "bad_input" }, { status: 400 });

  const { data, error } =
    preset === "all"
      ? await admin().rpc("admin_leaderboard", { p_mode: mode, p_limit: 100 })
      : await admin().rpc("admin_leaderboard_preset", { p_mode: mode, p_preset: preset, p_limit: 200 });
  if (error) return NextResponse.json({ error: "rpc" }, { status: 500 });
  return NextResponse.json(data ?? []);
}
