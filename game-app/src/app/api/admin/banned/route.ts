import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { assertSameOrigin } from "@/lib/origin";

// GET: 금칙어 목록(+영향 회원 수) / ?preview=단어 → 후보 단어 영향 미리보기
export async function GET(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const preview = new URL(req.url).searchParams.get("preview");
  if (preview !== null) {
    const word = preview.trim().toLowerCase().slice(0, 30);
    if (!word) return NextResponse.json({ count: 0, samples: [] });
    const { data, error } = await admin().rpc("admin_banned_preview", { p_word: word });
    if (error) return NextResponse.json({ error: "rpc" }, { status: 500 });
    return NextResponse.json(data ?? { count: 0, samples: [] });
  }
  const { data, error } = await admin().rpc("admin_banned_words");
  if (error) return NextResponse.json({ error: "rpc" }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  if (!assertSameOrigin(req) || !requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { word?: string } | null;
  const word = (body?.word ?? "").trim().toLowerCase().slice(0, 30);
  if (!word) return NextResponse.json({ error: "bad_input" }, { status: 400 });
  const { error } = await admin().from("game_banned_words").upsert({ word });
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  await logAdmin("banned_add", word, null);
  return NextResponse.json({ status: "ok" });
}

export async function DELETE(req: Request) {
  if (!assertSameOrigin(req) || !requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const word = new URL(req.url).searchParams.get("word") ?? "";
  if (!word) return NextResponse.json({ error: "bad_input" }, { status: 400 });
  const { error } = await admin().from("game_banned_words").delete().eq("word", word);
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  await logAdmin("banned_remove", word, null);
  return NextResponse.json({ status: "ok" });
}
