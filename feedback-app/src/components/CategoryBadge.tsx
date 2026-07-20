"use client";

import type { Category } from "@/lib/types";
import { categoryLabel } from "@/lib/i18n";
import { useLang } from "./LangProvider";

const STYLE: Record<Category, string> = {
  이벤트: "bg-primary/20 text-primary-400",
  굿즈: "bg-accent/20 text-accent",
  행사: "bg-emerald-500/15 text-emerald-400",
  콘텐츠: "bg-amber-400/15 text-amber-300",
  기타: "bg-white/10 text-muted",
};

export default function CategoryBadge({ category }: { category: Category }) {
  const { t } = useLang();
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${STYLE[category] ?? STYLE["기타"]}`}>
      {categoryLabel(category, t)}
    </span>
  );
}
