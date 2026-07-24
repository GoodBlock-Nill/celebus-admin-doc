import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { assertSameOrigin } from "@/lib/origin";

// game_config 오버레이 조회/저장 — 코드 기본값 위에 덮이는 관리자 튜닝 값
export async function GET(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await admin().from("game_config").select("config, updated_at").eq("id", 1).maybeSingle();
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  return NextResponse.json(data ?? { config: {} });
}

export async function PUT(req: Request) {
  if (!assertSameOrigin(req) || !requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { config?: unknown } | null;
  if (!body || typeof body.config !== "object" || body.config === null || Array.isArray(body.config)) {
    return NextResponse.json({ error: "bad_input" }, { status: 400 });
  }
  const { error } = await admin().from("game_config").upsert({ id: 1, config: body.config, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  await logAdmin("config_update", null, body.config);
  return NextResponse.json({ status: "ok" });
}
