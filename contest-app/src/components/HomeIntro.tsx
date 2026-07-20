"use client";

// 참여 방법 — 슬림 스트립 (업로드 → 투표 → 수상). 미디어 우선 홈의 보조 안내.
import { Upload, Heart, Gift, ChevronRight } from "lucide-react";
import { useLang } from "./LangProvider";

export default function HomeHowItWorks() {
  const { t } = useLang();
  const steps = [
    { icon: Upload, label: t("hiw_upload") },
    { icon: Heart, label: t("hiw_vote") },
    { icon: Gift, label: t("hiw_win") },
  ];
  return (
    <div className="flex items-center justify-center gap-2 rounded-[14px] bg-surface-1 px-4 py-3 ring-1 ring-hairline">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-muted">
            <s.icon className="h-3.5 w-3.5 text-primary-400" /> {s.label}
          </span>
          {i < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-subtle" />}
        </div>
      ))}
    </div>
  );
}
