import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { playerHash } from "@/lib/hash";
import { peekVoterId } from "@/lib/anon-identity";

// 데일리 그림 퀴즈 — 전일 성적 상위 5장 자동 선정(재선정 금지), 전원 동일 문제, KST 리셋.
// 첫 조회자가 오늘 세트를 구체화(RPC, 경합 안전). 각 문제의 내 진행 상태 + 미해결 문제의 타일 세트 반환.
const DUMMY_SYLLABLES = "가나다라마바사자카타파하고노도로모보소조코토포호구두루무부수주추쿠투푸후기니디리미비시지치키티피히".split("");
const DUMMY_LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

function buildTiles(answer: string): string[] {
  const chars = [...answer.replace(/\s/g, "")];
  const pool = /[가-힣]/.test(answer) ? DUMMY_SYLLABLES : DUMMY_LETTERS;
  const dummyCount = Math.max(4, 10 - chars.length);
  const dummies: string[] = [];
  while (dummies.length < dummyCount) {
    const d = pool[Math.floor(Math.random() * pool.length)];
    if (!chars.includes(d) && !dummies.includes(d)) dummies.push(d);
  }
  return [...chars, ...dummies].sort(() => Math.random() - 0.5);
}

export async function GET(req: Request) {
  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  const h = playerHash(anonId);

  await admin().rpc("game_sketch_daily_materialize");
  // 주간 베스트도 같은 진입점에서 게으르게 확정 (지난주 데일리가 있을 때만)
  await admin().rpc("game_sketch_weekly_best_materialize");

  const day = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10); // KST 오늘
  const { data, error } = await admin()
    .from("game_sketch_daily")
    .select("slot, game_sketch_drawing(id, player_hash, strokes, duration_ms, game_sketch_word(text))")
    .eq("day", day)
    .order("slot");
  if (error) return NextResponse.json({ error: "불러오지 못했어요." }, { status: 500 });

  const ids = (data ?? []).map((r) => (r.game_sketch_drawing as unknown as { id: string }).id);
  const { data: guesses } = ids.length
    ? await admin().from("game_sketch_guess").select("drawing_id, done, correct, tries, hint").eq("player_hash", h).in("drawing_id", ids)
    : { data: [] };
  const gmap = new Map((guesses ?? []).map((g) => [g.drawing_id, g]));

  const { data: bonus } = await admin().from("game_sketch_daily_bonus").select("day").eq("day", day).eq("player_hash", h).maybeSingle();

  const items = (data ?? []).map((r) => {
    const d = r.game_sketch_drawing as unknown as {
      id: string;
      player_hash: string;
      strokes: unknown;
      duration_ms: number;
      game_sketch_word: { text: { ko?: string } };
    };
    const g = gmap.get(d.id);
    const mine = d.player_hash === h;
    const answer = (d.game_sketch_word?.text?.ko ?? "").trim();
    const done = mine || !!g?.done;
    return {
      slot: r.slot,
      drawing: { id: d.id, strokes: d.strokes, duration_ms: d.duration_ms },
      mine,
      done,
      correct: !!g?.correct,
      word: done ? answer : null, // 끝난 문제만 정답 공개
      answer_len: [...answer.replace(/\s/g, "")].length,
      tiles: done ? null : buildTiles(answer),
      tries_left: Math.max(0, 3 - (g?.tries ?? 0)),
    };
  });

  return NextResponse.json({ day, items, bonus_claimed: !!bonus });
}
