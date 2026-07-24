import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";

const PRESETS = new Set(["this_week", "last_week", "this_month", "last_month", "all"]);

export async function GET(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") === "free" ? "free" : "daily";
  const preset = url.searchParams.get("preset") ?? "all";
  if (!PRESETS.has(preset)) return NextResponse.json({ error: "bad_input" }, { status: 400 });

  const { data, error } =
    preset === "all"
      ? await admin().rpc("admin_leaderboard", { p_mode: mode, p_limit: 100 })
      : await admin().rpc("admin_leaderboard_preset", { p_mode: mode, p_preset: preset, p_limit: 200 });
  if (error) return NextResponse.json({ error: "rpc" }, { status: 500 });
  return NextResponse.json(data ?? []);
}
