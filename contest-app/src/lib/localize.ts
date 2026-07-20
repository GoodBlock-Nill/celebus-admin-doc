// 콘테스트 본문을 뷰어 언어로 선택 — i18n[lang] 우선, 없으면 base(ko) 폴백.
import type { ContestLocale, ContestPublic, PrizeItem } from "./types";

type LocalizedContent = {
  title: string;
  description: string;
  rules: string;
  prize_summary: string;
  prizes: PrizeItem[];
};

export function localizeContest(c: ContestPublic, lang: string): LocalizedContent {
  const loc: ContestLocale = lang === "ko" ? {} : (c.i18n?.[lang] ?? {});
  const locPrizes = loc.prizes ?? [];
  return {
    title: loc.title?.trim() || c.title,
    description: loc.description?.trim() || c.description,
    rules: loc.rules?.trim() || c.rules,
    prize_summary: loc.prize_summary?.trim() || c.prize_summary,
    // 보상 이름·순위 라벨만 언어별 치환, 나머지 필드(이미지·인원·유형)는 base 유지
    prizes: (c.prizes ?? []).map((p, i) => ({
      ...p,
      name: locPrizes[i]?.name?.trim() || p.name,
      rank_label: locPrizes[i]?.rank_label?.trim() || p.rank_label,
    })),
  };
}
