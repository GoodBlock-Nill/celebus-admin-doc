// 콘테스트 본문을 뷰어 언어로 선택 — i18n[lang] 우선, 없으면 base(ko) 폴백.
import type { ContestLocale, ContestPublic } from "./types";

type LocalizedContent = {
  title: string;
  description: string;
  rules: string;
  prize_summary: string;
};

export function localizeContest(c: ContestPublic, lang: string): LocalizedContent {
  const loc: ContestLocale = lang === "ko" ? {} : (c.i18n?.[lang] ?? {});
  return {
    title: loc.title?.trim() || c.title,
    description: loc.description?.trim() || c.description,
    rules: loc.rules?.trim() || c.rules,
    prize_summary: loc.prize_summary?.trim() || c.prize_summary,
  };
}
