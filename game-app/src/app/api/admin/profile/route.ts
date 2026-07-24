import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const h = new URL(req.url).searchParams.get("h") ?? "";
  if (!/^[a-f0-9]{16,64}$/.test(h)) return NextResponse.json({ error: "bad_input" }, { status: 400 });
  const { data, error } = await admin().rpc("admin_profile_detail", { p_h: h });
  if (error) return NextResponse.json({ error: "rpc" }, { status: 500 });
  return NextResponse.json(data ?? {});
}
