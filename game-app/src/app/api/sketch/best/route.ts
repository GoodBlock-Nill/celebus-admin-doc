import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { peekVoterId } from "@/lib/anon-identity";

// 명예의 전당 — 지난주 데일리 선정작 중 최고 성적 1장 (작가 보상 = 드로우 티켓, 확정은 daily API 진입 시)
export async function GET(req: Request) {
  if (!peekVoterId(req)) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  const { data, error } = await admin()
    .from("game_sketch_weekly_best")
    .select("week_start, correct_count, game_sketch_drawing(id, strokes, duration_ms, thumb_url, game_sketch_word(text))")
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "불러오지 못했어요." }, { status: 500 });
  if (!data) return NextResponse.json({ best: null });

  const d = data.game_sketch_drawing as unknown as {
    id: string;
    strokes: unknown;
    duration_ms: number;
    thumb_url: string | null;
    game_sketch_word: { text: { ko?: string } };
  };
  return NextResponse.json({
    best: {
      week_start: data.week_start,
      correct_count: data.correct_count,
      word: d.game_sketch_word?.text?.ko ?? "",
      strokes: d.strokes,
      thumb_url: d.thumb_url,
    },
  });
}
