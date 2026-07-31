import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { invalidateBannedWordsCache } from "@/lib/profanity";

// 금칙어 관리 — 관리자 전용. lib/profanity.ts 기본 리스트에 병합되어 댓글·업로드·닉네임 검사에 사용.
const addSchema = z.object({ word: z.string().trim().min(1).max(40) });

export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await admin()
    .from("stage_banned_words")
    .select("word, created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  return NextResponse.json({ words: data });
}

export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = addSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값 오류" }, { status: 400 });

  const db = admin();
  const { error } = await db.from("stage_banned_words").upsert({ word: parsed.data.word });
  if (error) return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  invalidateBannedWordsCache();
  await logAdmin(db, "금칙어 추가", { targetType: "stage", detail: parsed.data.word });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const word = new URL(req.url).searchParams.get("word") ?? "";
  if (!word) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });

  const db = admin();
  const { error } = await db.from("stage_banned_words").delete().eq("word", word);
  if (error) return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  invalidateBannedWordsCache();
  await logAdmin(db, "금칙어 삭제", { targetType: "stage", detail: word });
  return NextResponse.json({ ok: true });
}
