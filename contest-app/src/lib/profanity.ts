// 기본 욕설/비속어 필터 (경량). 완벽하지 않으며, 신고→자동숨김 및 관리자 검수로 보완한다.
// export: 관리자 화면에서 내장 금칙어를 읽기 전용으로 표시하기 위함(코드 레벨 안전망).
export const BADWORDS = [
  // 한국어
  "씨발", "시발", "씨빨", "ㅅㅂ", "개새끼", "개새기", "새끼", "병신", "ㅂㅅ", "지랄", "ㅈㄹ",
  "좆", "좇", "존나", "죽어", "꺼져", "닥쳐", "미친놈", "미친년", "creep", "썅",
  // 영어
  "fuck", "fuk", "shit", "bitch", "asshole", "bastard", "dick", "cunt", "slut", "retard",
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s._\-*]+/g, "");
}

// 하드코딩 기본 리스트만 검사(동기). 기본 안전망.
export function containsProfanity(...texts: string[]): boolean {
  const joined = normalize(texts.join(" "));
  return BADWORDS.some((w) => joined.includes(normalize(w)));
}

// ── 관리자 DB 금칙어(stage_banned_words) 병합 검사 ──
// 요청마다 조회하지 않도록 짧은 TTL로 캐싱. 하드코딩 기본 리스트와 병합해 검사한다.
import { admin } from "./db-admin";

let dbCache: { words: string[]; at: number } | null = null;
const DB_TTL_MS = 60_000;

async function getDbBannedWords(): Promise<string[]> {
  const now = Date.now();
  if (dbCache && now - dbCache.at < DB_TTL_MS) return dbCache.words;
  try {
    const { data } = await admin().from("stage_banned_words").select("word");
    const words = ((data ?? []) as { word: string }[]).map((r) => r.word);
    dbCache = { words, at: now };
    return words;
  } catch {
    return dbCache?.words ?? [];
  }
}

// 관리자 추가/삭제 직후 즉시 반영(동일 서버 인스턴스 한정, 그 외는 TTL로 반영)
export function invalidateBannedWordsCache(): void {
  dbCache = null;
}

// 하드코딩 기본 + 관리자 DB 목록 병합 검사(서버 전용). 매칭 시 true.
export async function checkProfanity(...texts: string[]): Promise<boolean> {
  if (containsProfanity(...texts)) return true;
  const joined = normalize(texts.join(" "));
  const dbWords = await getDbBannedWords();
  return dbWords.some((w) => joined.includes(normalize(w)));
}
