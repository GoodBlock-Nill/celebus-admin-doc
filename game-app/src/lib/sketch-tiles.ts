// CELEB SKETCH 글자 타일 빌더 v2 (서버 전용) — 출시앱 수준 고도화 (2026-08-19).
// 리서치 근거:
//  · Draw Something — 정답 글자 + "red herring"을 섞은 고정 타일. 재미의 본체는 애너그램 고민
//  · 퍼즐 설계 문헌 — 좋은 오답은 "정답과 글자가 일부 겹치는 그럴듯한 실단어" (미끼 단어)
// v2 설계:
//  ① 미끼 단어: 사전의 다른 실단어 1~2개의 글자를 통째로 섞는다 → 타일로 조립 가능한 가짜 후보가 생김
//  ② 질감 매칭: 한국어 필러는 정답의 받침 비율에 맞춰 선택 (정답 음절이 도드라지지 않게)
//  ③ 결정적 셔플: (그림·유저·언어) 시드 고정 — 재접속해도 타일이 흔들리지 않음
export type WordText = { ko?: string; en?: string; ja?: string; ja_kana?: string };
export type TileSet = { tiles: string[]; answer_len: number; lang: "ko" | "en" | "ja" };
export type TileOpts = { decoys?: WordText[]; seed?: string };

// ── 결정적 PRNG (mulberry32) — 시드 문자열 → 안정 셔플 ──
function seedFrom(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function prng(seed: number) {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const shuffleWith = <T,>(arr: T[], rnd: () => number): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ── 언어 유틸 ──
const isKana = (s: string) => /^[぀-ゟ゠-ヿー\s]+$/.test(s);
const hiraToKata = (s: string) => s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
const hasBatchim = (ch: string) => {
  const code = ch.charCodeAt(0);
  return code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
};

// 질감별 한국어 필러 — 실단어에 흔한 음절 (받침 유/무 분리)
const KO_BATCHIM = "물불별들집앞속밤낮꽃옷돈문말선울강산눈봄땅힘".split("");
const KO_OPEN = "가나다리소보재추코해피어우이오주네미도바".split("");
// 영어 빈도(etaoin) 가중 필러 / 일본어 상용 가나
const EN_FILLER = "eeaarriioottnnsslucmdpbg".split("");
const JA_FILLER = "アイウエオカキクケコサシスタチツテトナニノハヒフマミムメモヤユラリルレロンー".split("");

export function answerFor(text: WordText, lang: "ko" | "en" | "ja"): { answer: string; lang: "ko" | "en" | "ja" } {
  if (lang === "en" && text.en) return { answer: text.en, lang: "en" };
  if (lang === "ja") {
    const kana = text.ja_kana ?? (text.ja && isKana(text.ja) ? text.ja : null);
    if (kana) return { answer: hiraToKata(kana), lang: "ja" };
    if (text.en) return { answer: text.en, lang: "en" };
  }
  return { answer: text.ko ?? "", lang: "ko" };
}
const charsOf = (answer: string) => [...answer.toLowerCase().replace(/[\s-]/g, "")];

export function buildTileSet(text: WordText, userLang: string, opts: TileOpts = {}): TileSet {
  const lang = userLang === "en" || userLang === "ja" ? userLang : "ko";
  const { answer, lang: tileLang } = answerFor(text, lang);
  const chars = charsOf(answer);
  const rnd = prng(seedFrom(opts.seed ?? answer));

  const budget = tileLang === "ko" ? Math.max(10, chars.length + 5) : Math.max(12, chars.length + 5);
  const counts = new Map<string, number>();
  const tiles: string[] = [];
  const push = (ch: string, cap = 2) => {
    if (tiles.length >= budget) return;
    const n = counts.get(ch) ?? 0;
    if (n >= cap) return; // 같은 글자 최대 2개 (정답 중복 글자는 예외적으로 아래서 우선 채움)
    counts.set(ch, n + 1);
    tiles.push(ch);
  };
  // 1) 정답 글자 전부 (중복 포함 — 우유 = 우·유 각각)
  for (const c of chars) {
    counts.set(c, (counts.get(c) ?? 0) + 1);
    tiles.push(c);
  }

  // 2) 미끼 단어 — 같은 언어 표기의 다른 실단어 글자를 통째로 (예산 안에서 1~2개)
  //    타일만으로 조립 가능한 "그럴듯한 오답 후보"를 심는 것이 핵심 (red herring)
  const decoys = shuffleWith(opts.decoys ?? [], rnd)
    .map((d) => charsOf(answerFor(d, tileLang).answer))
    .filter((cs) => cs.length > 0 && cs.length <= budget - chars.length);
  let planted = 0;
  for (const dc of decoys) {
    if (planted >= 2) break;
    const need = dc.filter((c) => (counts.get(c) ?? 0) === 0).length;
    if (tiles.length + need > budget) continue; // 통째로 안 들어가면 다음 미끼
    for (const c of dc) if ((counts.get(c) ?? 0) < 1 || (planted === 0 && (counts.get(c) ?? 0) < 2)) push(c);
    planted++;
  }

  // 3) 질감 필러 — 남는 칸 채움
  if (tileLang === "ko") {
    const batchimRatio = chars.filter(hasBatchim).length / Math.max(1, chars.length);
    let guard = 0;
    while (tiles.length < budget && guard++ < 100) {
      const pool = rnd() < batchimRatio ? KO_BATCHIM : KO_OPEN;
      push(pool[Math.floor(rnd() * pool.length)], 1);
    }
  } else {
    const pool = tileLang === "ja" ? JA_FILLER : EN_FILLER;
    let guard = 0;
    while (tiles.length < budget && guard++ < 100) push(pool[Math.floor(rnd() * pool.length)], tileLang === "en" ? 2 : 1);
  }

  return { tiles: shuffleWith(tiles, rnd), answer_len: chars.length, lang: tileLang };
}

// 힌트(폭탄) — 유저 타일에서 정답에 불필요한 더미의 절반(최소 2개)을 결정적으로 고른다
export function computeBombIndices(answer: string, tiles: string[]): number[] {
  const need = new Map<string, number>();
  for (const c of answer.toLowerCase().replace(/[\s-]/g, "")) need.set(c, (need.get(c) ?? 0) + 1);
  const dummies: number[] = [];
  tiles.forEach((tile, i) => {
    const c = tile.toLowerCase();
    const n = need.get(c) ?? 0;
    if (n > 0) need.set(c, n - 1);
    else dummies.push(i);
  });
  const count = Math.max(2, Math.floor(dummies.length / 2));
  return [...dummies.filter((_, i) => i % 2 === 0), ...dummies.filter((_, i) => i % 2 === 1)].slice(0, count);
}
