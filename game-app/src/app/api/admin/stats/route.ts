import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await admin().rpc("admin_game_stats");
  if (error) return NextResponse.json({ error: "rpc" }, { status: 500 });
  return NextResponse.json(data ?? {});
}
