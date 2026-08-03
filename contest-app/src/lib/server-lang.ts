import { cookies } from "next/headers";
import { type Lang, messages } from "@/lib/i18n";

// 서버에서 사용자 언어 결정 — LangProvider가 심는 cfs_lang 쿠키 기준(없으면 ko).
// 쿠키를 읽으므로 이 값을 쓰는 라우트는 동적 렌더가 된다(데이터는 unstable_cache로 별도 캐시).
export async function getServerLang(): Promise<Lang> {
  const c = (await cookies()).get("cfs_lang")?.value;
  return c === "ja" || c === "en" ? c : "ko";
}

// 서버용 번역 함수 — 클라이언트 useLang().t 와 동일 규칙(폴백 ko)
export function serverT(lang: Lang) {
  return (k: string): string => messages[lang][k] ?? messages.ko[k] ?? k;
}
