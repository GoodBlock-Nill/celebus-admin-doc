import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { invalidateBannedWordsCache, BADWORDS } from "@/lib/profanity";

// 금칙어 관리 — 관리자 전용. lib/profanity.ts 기본 리스트에 병합되어 댓글·업로드·닉네임 검사에 사용.
const addSchema = z.object({ word: z.string().trim().min(1).max(40) });

export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = admin();
  const [wordsRes, disabledRes] = await Promise.all([
    db.from("stage_banned_words").select("word, created_at").order("created_at", { ascending: false }),
    db.from("stage_disabled_words").select("word"),
  ]);
  if (wordsRes.error) return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  // words: 관리자 추가분(편집) / builtin: 코드 내장 기본(읽기 전용) / disabled: 운영자가 끈 내장어
  return NextResponse.json({
    words: wordsRes.data,
    builtin: BADWORDS,
    disabled: ((disabledRes.data ?? []) as { word: string }[]).map((r) => r.word),
  });
}

// 내장 금칙어 개별 비활성/재활성(오탐 대응)
const toggleSchema = z.object({ word: z.string().trim().min(1).max(40), disabled: z.boolean() });

export async function PATCH(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = toggleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "입력값 오류" }, { status: 400 });

  const db = admin();
  if (parsed.data.disabled) {
    const { error } = await db.from("stage_disabled_words").upsert({ word: parsed.data.word });
    if (error) return NextResponse.json({ error: "처리 실패" }, { status: 500 });
    await logAdmin(db, "내장 금칙어 비활성화", { targetType: "stage", detail: parsed.data.word });
  } else {
    const { error } = await db.from("stage_disabled_words").delete().eq("word", parsed.data.word);
    if (error) return NextResponse.json({ error: "처리 실패" }, { status: 500 });
    await logAdmin(db, "내장 금칙어 재활성화", { targetType: "stage", detail: parsed.data.word });
  }
  invalidateBannedWordsCache();
  return NextResponse.json({ ok: true });
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
