// 기본 욕설/비속어 필터 (경량). 완벽하지 않으며, 신고→자동숨김 및 관리자 검수로 보완한다.
// export: 관리자 화면에서 내장 금칙어를 읽기 전용으로 표시하기 위함(코드 레벨 안전망).
export const BADWORDS = [
  // 한국어 — 부분 문자열 매칭이라 오탐 낮은 표기 위주(변형/합성은 대표형이 커버)
  "씨발", "시발", "씨빨", "씨팔", "시팔", "ㅅㅂ", "ㅆㅂ",
  "개새끼", "개새기", "새끼", "씹새끼", "씹창",
  "병신", "ㅂㅅ", "지랄", "ㅈㄹ", "염병",
  "좆", "좇", "존나",
  "죽어", "뒈져", "꺼져", "닥쳐",
  "미친놈", "미친년", "썅", "등신", "또라이", "찐따",
  "창녀", "걸레", "애미", "느금마", "니애미",
  "개소리", "개년", "개놈", "엿먹어",
  // 영어
  "fuck", "fuk", "shit", "bitch", "asshole", "bastard", "dick", "cunt", "pussy",
  "slut", "whore", "retard", "faggot", "nigger", "twat", "wanker", "creep",
  // 일본어 (JA)
  "死ね", "しね", "殺す", "ころす", "くそ", "クソ", "きちがい", "気違い", "キチガイ",
  "ちくしょう", "畜生", "くたばれ", "ブス", "デブ", "きもい", "キモい", "うざい", "ウザい",
  "まんこ", "ちんこ", "ちんぽ", "やりまん", "あほ", "アホ", "ボケ", "クズ",
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s._\-*]+/g, "");
}

// 하드코딩 기본 리스트만 검사(동기). 기본 안전망.
export function containsProfanity(...texts: string[]): boolean {
  const joined = normalize(texts.join(" "));
  return BADWORDS.some((w) => joined.includes(normalize(w)));
}

// ── 관리자 DB 금칙어 병합 검사 ──
// custom(관리자 추가) + disabled(내장 비활성) 목록을 짧은 TTL로 캐싱해 요청마다 조회하지 않는다.
import { admin } from "./db-admin";

type WordConfig = { custom: string[]; disabled: Set<string> };
let dbCache: (WordConfig & { at: number }) | null = null;
const DB_TTL_MS = 60_000;

async function getWordConfig(): Promise<WordConfig> {
  const now = Date.now();
  if (dbCache && now - dbCache.at < DB_TTL_MS) return { custom: dbCache.custom, disabled: dbCache.disabled };
  try {
    const db = admin();
    const [c, d] = await Promise.all([
      db.from("stage_banned_words").select("word"),
      db.from("stage_disabled_words").select("word"),
    ]);
    const custom = ((c.data ?? []) as { word: string }[]).map((r) => r.word);
    const disabled = new Set(((d.data ?? []) as { word: string }[]).map((r) => r.word));
    dbCache = { custom, disabled, at: now };
    return { custom, disabled };
  } catch {
    return dbCache ? { custom: dbCache.custom, disabled: dbCache.disabled } : { custom: [], disabled: new Set() };
  }
}

// 관리자 추가/삭제/비활성 직후 즉시 반영(동일 서버 인스턴스 한정, 그 외는 TTL로 반영)
export function invalidateBannedWordsCache(): void {
  dbCache = null;
}

// 내장 기본(비활성 제외) + 관리자 추가 목록 병합 검사(서버 전용). 매칭 시 true.
export async function checkProfanity(...texts: string[]): Promise<boolean> {
  const joined = normalize(texts.join(" "));
  const { custom, disabled } = await getWordConfig();
  for (const w of BADWORDS) {
    if (disabled.has(w)) continue; // 운영자가 비활성화한 내장어는 제외
    if (joined.includes(normalize(w))) return true;
  }
  return custom.some((w) => joined.includes(normalize(w)));
}
