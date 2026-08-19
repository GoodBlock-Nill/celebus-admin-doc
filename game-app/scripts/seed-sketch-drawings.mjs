// CELEB SKETCH 시드 그림 주입 — 맞히기 풀 콜드스타트 해소 (운영 도구).
// 도형 기반 스트로크 로그를 생성해 seed 계정으로 삽입한다 (자기 그림 제외 규칙 때문에
// 테스터가 곧 유일한 공급자인 초기에 풀이 비는 문제 대응).
// 사용: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-sketch-drawings.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 필요");
  process.exit(1);
}
const db = createClient(url, key);
const SEED_HASH = "seed-celebus-official";

// ── 스트로크 생성 유틸 (정규화 좌표 0..1, t = 경과 ms) ──
let clock = 0;
const stroke = (color, width, pts, msPerPt = 40) => {
  clock += 350; // 획 사이 생각 시간
  const points = pts.map(([x, y], i) => ({ x, y, t: clock + i * msPerPt }));
  clock = points[points.length - 1].t;
  return { color, width, points };
};
const circle = (cx, cy, r, n = 28) =>
  Array.from({ length: n + 1 }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2 - Math.PI / 2) * r, cy + Math.sin((i / n) * Math.PI * 2 - Math.PI / 2) * r]);
const arc = (cx, cy, r, a0, a1, n = 20) =>
  Array.from({ length: n + 1 }, (_, i) => [cx + Math.cos(a0 + ((a1 - a0) * i) / n) * r, cy + Math.sin(a0 + ((a1 - a0) * i) / n) * r]);
const line = (x0, y0, x1, y1, n = 10) => Array.from({ length: n + 1 }, (_, i) => [x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n]);
const star = (cx, cy, r) => {
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const ang = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push([cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr]);
  }
  return pts;
};
const heart = (cx, cy, s) =>
  Array.from({ length: 40 }, (_, i) => {
    const th = (i / 39) * Math.PI * 2;
    return [cx + s * 0.052 * 16 * Math.sin(th) ** 3, cy - s * 0.052 * (13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th))];
  });

const BLACK = "#1f1f24", RED = "#e5484d", ORANGE = "#f0883e", YELLOW = "#f5c451", GREEN = "#46a758", BLUE = "#3e8ef7", PURPLE = "#8b5cf6", BROWN = "#8d6e52";

// ── 제시어별 그림 정의 ──
const drawings = {
  "달": () => [stroke(YELLOW, 9, circle(0.5, 0.45, 0.28)), stroke(YELLOW, 4, arc(0.42, 0.4, 0.06, 0, Math.PI)), stroke(YELLOW, 4, arc(0.58, 0.42, 0.05, 0, Math.PI))],
  "산": () => [stroke(GREEN, 9, [[0.08, 0.8], [0.38, 0.25], [0.62, 0.72]]), stroke(GREEN, 9, [[0.5, 0.6], [0.72, 0.32], [0.92, 0.8]]), stroke(BLACK, 4, [[0.32, 0.36], [0.38, 0.25], [0.44, 0.36]])],
  "별": () => [stroke(YELLOW, 9, star(0.5, 0.5, 0.32))],
  "하트": () => [stroke(RED, 9, heart(0.5, 0.42, 1))],
  "무지개": () => [stroke(RED, 9, arc(0.5, 0.85, 0.4, Math.PI, 2 * Math.PI)), stroke(YELLOW, 9, arc(0.5, 0.85, 0.32, Math.PI, 2 * Math.PI)), stroke(BLUE, 9, arc(0.5, 0.85, 0.24, Math.PI, 2 * Math.PI))],
  "눈사람": () => [stroke(BLACK, 6, circle(0.5, 0.32, 0.15)), stroke(BLACK, 6, circle(0.5, 0.66, 0.24)), stroke(BLACK, 4, [[0.45, 0.3], [0.45, 0.3]]), stroke(BLACK, 4, [[0.55, 0.3], [0.55, 0.3]]), stroke(ORANGE, 4, [[0.5, 0.34], [0.56, 0.36]])],
  "태양": () => [stroke(ORANGE, 9, circle(0.5, 0.45, 0.2)), ...Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return stroke(ORANGE, 5, line(0.5 + Math.cos(a) * 0.26, 0.45 + Math.sin(a) * 0.26, 0.5 + Math.cos(a) * 0.36, 0.45 + Math.sin(a) * 0.36, 4)); })],
  "풍선": () => [stroke(RED, 7, circle(0.5, 0.35, 0.18)), stroke(BLACK, 4, [[0.5, 0.53], [0.48, 0.62], [0.52, 0.72], [0.5, 0.85]])],
  "시계": () => [stroke(BLACK, 7, circle(0.5, 0.5, 0.28)), stroke(BLACK, 5, line(0.5, 0.5, 0.5, 0.32)), stroke(BLACK, 5, line(0.5, 0.5, 0.64, 0.5)), stroke(RED, 3, [[0.5, 0.24], [0.5, 0.24]])],
  "구름": () => [stroke(BLUE, 8, arc(0.38, 0.5, 0.12, Math.PI * 0.5, Math.PI * 1.6)), stroke(BLUE, 8, arc(0.52, 0.42, 0.14, Math.PI * 0.8, Math.PI * 2)), stroke(BLUE, 8, arc(0.66, 0.52, 0.11, Math.PI * 1.2, Math.PI * 2.5)), stroke(BLUE, 8, line(0.3, 0.6, 0.74, 0.6))],
  "연": () => [stroke(PURPLE, 7, [[0.5, 0.12], [0.7, 0.35], [0.5, 0.6], [0.3, 0.35], [0.5, 0.12]]), stroke(PURPLE, 4, line(0.5, 0.12, 0.5, 0.6, 6)), stroke(PURPLE, 4, line(0.3, 0.35, 0.7, 0.35, 6)), stroke(BROWN, 4, [[0.5, 0.6], [0.55, 0.7], [0.45, 0.8], [0.52, 0.9]])],
  "우산": () => [stroke(BLUE, 8, arc(0.5, 0.45, 0.3, Math.PI, 2 * Math.PI)), stroke(BLUE, 5, line(0.2, 0.45, 0.8, 0.45, 8)), stroke(BLACK, 5, line(0.5, 0.45, 0.5, 0.78, 8)), stroke(BLACK, 5, arc(0.55, 0.78, 0.05, 0, Math.PI))],
};

const { data: words, error } = await db.from("game_sketch_word").select("id, text").in("text->>ko", Object.keys(drawings));
if (error) { console.error(error); process.exit(1); }

let inserted = 0;
for (const w of words ?? []) {
  const ko = w.text.ko;
  // 이미 시드가 있으면 중복 방지
  const { count } = await db.from("game_sketch_drawing").select("id", { count: "exact", head: true }).eq("player_hash", SEED_HASH).eq("word_id", w.id);
  if ((count ?? 0) > 0) { console.log(`skip ${ko} (이미 존재)`); continue; }
  clock = 0;
  const strokes = drawings[ko]();
  const durationMs = strokes[strokes.length - 1].points.at(-1).t + 200;
  const { error: insErr } = await db.from("game_sketch_drawing").insert({
    player_hash: SEED_HASH,
    word_id: w.id,
    strokes,
    duration_ms: durationMs,
    status: "approved",
    ai_verdict: { action: "approve", reason: "운영 시드 그림" },
  });
  console.log(insErr ? `FAIL ${ko}: ${insErr.message}` : `ok ${ko}`);
  if (!insErr) inserted++;
}
console.log(`done — ${inserted}장 삽입`);
