"use client";

import type { Target } from "@/lib/types";
import { targetLabel } from "@/lib/i18n";
import { useLang } from "./LangProvider";

const STYLE: Record<Target, string> = {
  "전체": "bg-white/10 text-muted",
  V01D: "bg-primary/20 text-primary-400",
  CELEBUS: "bg-accent/20 text-accent",
  ix: "bg-amber-500/15 text-amber-400",
};

export default function TargetBadge({ target }: { target: Target }) {
  const { t } = useLang();
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${STYLE[target]}`}>
      {targetLabel(target, t)}
    </span>
  );
}
