// CELEB SKETCH 글자 타일 빌더 (서버 전용) — 유저 언어별 타일 (2026-08-19 전면 개선).
// 원칙 (Draw Something 검증 패턴):
//  · 타일은 유저 언어로 — ko=음절, en=알파벳(12타일 고정), ja=가나(12타일 고정, 한자 단어는 ja_kana 읽기)
//  · 더미는 "그럴듯하게" — ko는 실제 단어에 흔한 음절 풀(받침·복합모음 포함), en은 모음 가중, ja는 상용 가나
//  · ja 읽기가 없고 원문이 가나가 아니면 en으로 폴백 (구조적 미아 방지)
export type WordText = { ko?: string; en?: string; ja?: string; ja_kana?: string };
export type TileSet = { tiles: string[]; answer_len: number; lang: "ko" | "en" | "ja" };

// 실제 단어에서 흔한 음절 — 받침·복합모음 포함해 정답과 섞여도 티가 안 나게
const KO_DUMMIES = "강산불빛달집물별손발밤낮꿈길옷돌숲창문책상빵떡국김밥춤노래검정하늘바다구름연필가방시계공원학차버스택기린곰새우유".split("");
const EN_CONSONANTS = "bcdfghjklmnpqrstvwxyz".split("");
const EN_VOWELS = "aeiou".split("");
const JA_DUMMIES = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワンガギグゲゴザジズゼゾダデドバビブベボパピプペポー".split("");

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
const isKana = (s: string) => /^[぀-ゟ゠-ヿー\s]+$/.test(s);
const hiraToKata = (s: string) => s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));

function withDummies(chars: string[], pool: string[], total: number): string[] {
  const dummies: string[] = [];
  let guard = 0;
  while (chars.length + dummies.length < total && guard++ < 200) {
    const d = pool[Math.floor(Math.random() * pool.length)];
    if (!chars.includes(d) && !dummies.includes(d)) dummies.push(d);
  }
  return shuffle([...chars, ...dummies]);
}

// 유저 언어의 정답 문자열 (판정·힌트 기준과 동일 규칙)
export function answerFor(text: WordText, lang: "ko" | "en" | "ja"): { answer: string; lang: "ko" | "en" | "ja" } {
  if (lang === "en" && text.en) return { answer: text.en, lang: "en" };
  if (lang === "ja") {
    const kana = text.ja_kana ?? (text.ja && isKana(text.ja) ? text.ja : null);
    if (kana) return { answer: hiraToKata(kana), lang: "ja" };
    if (text.en) return { answer: text.en, lang: "en" }; // 읽기 데이터 없는 예외 — en 폴백
  }
  return { answer: text.ko ?? "", lang: "ko" };
}

export function buildTileSet(text: WordText, userLang: string): TileSet {
  const lang = userLang === "en" || userLang === "ja" ? userLang : "ko";
  const { answer, lang: tileLang } = answerFor(text, lang);
  const chars = [...answer.toLowerCase().replace(/[\s-]/g, "")];

  if (tileLang === "ko") {
    // 음절 타일 10개 고정 (정답이 길면 정답+4)
    return { tiles: withDummies(chars, KO_DUMMIES, Math.max(10, chars.length + 4)), answer_len: chars.length, lang: "ko" };
  }
  if (tileLang === "ja") {
    return { tiles: withDummies(chars, JA_DUMMIES, Math.max(12, chars.length + 4)), answer_len: chars.length, lang: "ja" };
  }
  // en — 12타일 고정(Draw Something), 더미는 모음 1개 이상 보장해 조합이 자연스럽게
  const pool = [...EN_CONSONANTS, ...EN_VOWELS, ...EN_VOWELS];
  const tiles = withDummies(chars, pool, Math.max(12, chars.length + 4));
  return { tiles, answer_len: chars.length, lang: "en" };
}
