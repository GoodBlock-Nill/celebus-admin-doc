import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { playerHash } from "@/lib/hash";
import { peekVoterId } from "@/lib/anon-identity";
import { answerFor, buildTileSet, type WordText } from "@/lib/sketch-tiles";

// 데일리 그림 퀴즈 — 전일 성적 상위 5장 자동 선정(재선정 금지), 전원 동일 문제, KST 리셋.
// 첫 조회자가 오늘 세트를 구체화(RPC, 경합 안전). 각 문제의 내 진행 상태 + 미해결 문제의 타일 세트 반환.
export async function GET(req: Request) {
  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  const h = playerHash(anonId);
  const lang = (new URL(req.url).searchParams.get("lang") ?? "ko") as "ko" | "en" | "ja";

  await admin().rpc("game_sketch_daily_materialize");
  // 주간 베스트도 같은 진입점에서 게으르게 확정 (지난주 데일리가 있을 때만)
  await admin().rpc("game_sketch_weekly_best_materialize");

  const day = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10); // KST 오늘
  const { data, error } = await admin()
    .from("game_sketch_daily")
    .select("slot, game_sketch_drawing(id, player_hash, strokes, duration_ms, game_sketch_word(text, category))")
    .eq("day", day)
    .order("slot");
  if (error) return NextResponse.json({ error: "불러오지 못했어요." }, { status: 500 });

  const ids = (data ?? []).map((r) => (r.game_sketch_drawing as unknown as { id: string }).id);
  const { data: guesses } = ids.length
    ? await admin().from("game_sketch_guess").select("drawing_id, done, correct, tries, hint").eq("player_hash", h).in("drawing_id", ids)
    : { data: [] };
  const gmap = new Map((guesses ?? []).map((g) => [g.drawing_id, g]));

  const { data: bonus } = await admin().from("game_sketch_daily_bonus").select("day").eq("day", day).eq("player_hash", h).maybeSingle();

  // 미끼 단어 풀 (한 번에 조회해 문제별로 배분)
  const { data: decoyRows } = await admin().from("game_sketch_word").select("text, category").eq("active", true).limit(60);

  const items = (data ?? []).map((r) => {
    const d = r.game_sketch_drawing as unknown as {
      id: string;
      player_hash: string;
      strokes: unknown;
      duration_ms: number;
      game_sketch_word: { text: WordText; category: string };
    };
    const g = gmap.get(d.id);
    const mine = d.player_hash === h;
    const text = (d.game_sketch_word?.text ?? {}) as WordText;
    const done = mine || !!g?.done;
    const sameCat = (decoyRows ?? []).filter((x) => x.category === d.game_sketch_word?.category && (x.text as WordText).ko !== text.ko);
    const stable = (a: { text: unknown }, b: { text: unknown }) => String((a.text as WordText).ko).localeCompare(String((b.text as WordText).ko));
    const decoys = [...sameCat.sort(stable).slice(0, 6), ...(decoyRows ?? []).sort(stable).slice(0, 6)].map((x) => x.text as WordText);
    const set = done ? null : buildTileSet(text, lang, { decoys, seed: `${day}:${d.id}:${h}:${lang}` });
    return {
      slot: r.slot,
      drawing: { id: d.id, strokes: d.strokes, duration_ms: d.duration_ms },
      mine,
      done,
      correct: !!g?.correct,
      word: done ? answerFor(text, lang).answer : null, // 끝난 문제만 정답 공개 (유저 언어)
      answer_len: set?.answer_len ?? 0,
      tiles: set?.tiles ?? null,
      tile_lang: set?.lang ?? lang,
      tries_left: Math.max(0, 3 - (g?.tries ?? 0)),
    };
  });

  return NextResponse.json({ day, items, bonus_claimed: !!bonus });
}
