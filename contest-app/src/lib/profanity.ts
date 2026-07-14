// 기본 욕설/비속어 필터 (경량). 완벽하지 않으며, 신고→자동숨김 및 관리자 검수로 보완한다.
const BADWORDS = [
  // 한국어
  "씨발", "시발", "씨빨", "ㅅㅂ", "개새끼", "개새기", "새끼", "병신", "ㅂㅅ", "지랄", "ㅈㄹ",
  "좆", "좇", "존나", "죽어", "꺼져", "닥쳐", "미친놈", "미친년", "creep", "썅",
  // 영어
  "fuck", "fuk", "shit", "bitch", "asshole", "bastard", "dick", "cunt", "slut", "retard",
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s._\-*]+/g, "");
}

export function containsProfanity(...texts: string[]): boolean {
  const joined = normalize(texts.join(" "));
  return BADWORDS.some((w) => joined.includes(normalize(w)));
}
