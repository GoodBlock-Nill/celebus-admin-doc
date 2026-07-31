// 콘테스트 본문을 뷰어 언어로 선택 — i18n[lang] 우선, 없으면 base(ko) 폴백.
import type { ContestLocale, ContestPublic, PrizeItem, StageI18n } from "./types";

// ── 아카이브·토너먼트 다국어 현지화 (i18n[lang] 우선, 없으면 base(ko) 폴백) ──
export function localizeStageText(
  base: { title: string; description?: string; i18n?: StageI18n },
  lang: string,
): { title: string; description: string } {
  const loc = lang === "ko" ? undefined : base.i18n?.[lang];
  return {
    title: loc?.title?.trim() || base.title,
    description: loc?.description?.trim() || base.description || "",
  };
}

// 제목만 현지화(i18n 소스를 명시적으로 전달 — 예: 토너먼트의 stage_title은 stage_i18n 사용)
export function localizeTitle(base: string, i18n: StageI18n | undefined, lang: string): string {
  if (lang === "ko" || !i18n) return base;
  return i18n[lang]?.title?.trim() || base;
}

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
