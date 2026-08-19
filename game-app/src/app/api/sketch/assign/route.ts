import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { playerHash } from "@/lib/hash";
import { peekVoterId } from "@/lib/anon-identity";

// 맞히기 그림 배정 — "본 적 없는 그림 중 정답률 데이터가 적은 것 우선" (기획 §9: 새 그림 노출 기회 보장).
// 진행 중(시도 남음) 그림이 있으면 그걸 이어서 배정. 글자 타일 세트는 서버가 생성 (§4.3 — 더미 구성 공정성).
const DUMMY_SYLLABLES = "가나다라마바사자카타파하고노도로모보소조코토포호구두루무부수주추쿠투푸후기니디리미비시지치키티피히".split("");
const DUMMY_LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

function buildTiles(answer: string): string[] {
  const chars = [...answer.replace(/\s/g, "")];
  const isKo = /[가-힣]/.test(answer);
  const pool = isKo ? DUMMY_SYLLABLES : DUMMY_LETTERS;
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

  // 1) 진행 중(미완료) 그림 이어서
  const { data: inProgress } = await admin()
    .from("game_sketch_guess")
    .select("drawing_id, tries")
    .eq("player_hash", h)
    .eq("done", false)
    .limit(1);

  let drawingId = inProgress?.[0]?.drawing_id as string | undefined;
  let tries = inProgress?.[0]?.tries ?? 0;

  if (!drawingId) {
    // 2) 새 그림 — 내 그림 제외 + 이미 끝낸 그림 제외, 노출 적은 순
    const { data: seen } = await admin().from("game_sketch_guess").select("drawing_id").eq("player_hash", h);
    const seenIds = (seen ?? []).map((s) => s.drawing_id);
    let q = admin()
      .from("game_sketch_drawing")
      .select("id")
      .eq("status", "approved")
      .neq("player_hash", h)
      .order("guess_count", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(1);
    if (seenIds.length > 0) q = q.not("id", "in", `(${seenIds.join(",")})`);
    const { data: fresh, error } = await q;
    if (error) return NextResponse.json({ error: "배정에 실패했어요." }, { status: 500 });
    drawingId = fresh?.[0]?.id;
    tries = 0;
  }
  if (!drawingId) return NextResponse.json({ empty: true }); // 맞힐 그림 없음 → 그리기 유도 (콜드스타트 §4.4)

  const { data: d } = await admin()
    .from("game_sketch_drawing")
    .select("id, strokes, duration_ms, game_sketch_word(text)")
    .eq("id", drawingId)
    .single();
  if (!d) return NextResponse.json({ error: "배정에 실패했어요." }, { status: 500 });

  const answer = ((d.game_sketch_word as unknown as { text: { ko?: string } })?.text?.ko ?? "").trim();
  // 정답 평문은 내려보내지 않는다 (§8) — 길이와 타일만
  return NextResponse.json({
    drawing: { id: d.id, strokes: d.strokes, duration_ms: d.duration_ms },
    answer_len: [...answer.replace(/\s/g, "")].length,
    tiles: buildTiles(answer),
    tries_left: Math.max(0, 3 - tries),
  });
}
