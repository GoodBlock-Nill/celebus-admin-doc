import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { peekVoterId } from "@/lib/anon-identity";

// 그리기용 제시어 3개 배정 — 난이도 섞어 무작위 (기획 §4.2: 3택 1이 그리기 부담을 낮춘다)
export async function GET(req: Request) {
  if (!peekVoterId(req)) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  const { data, error } = await admin().from("game_sketch_word").select("id, text, difficulty").eq("active", true);
  if (error || !data?.length) return NextResponse.json({ error: "제시어를 불러오지 못했어요." }, { status: 500 });
  const picked = [...data].sort(() => Math.random() - 0.5).slice(0, 3);
  return NextResponse.json({
    words: picked.map((w) => ({ id: w.id, text: (w.text as { ko?: string }).ko ?? "", difficulty: w.difficulty })),
  });
}
