"use client";

// 참여 방법 — 3스텝 시각 카드 (올리기 → 투표 → 수상). 아이콘 뱃지 + 스텝 번호 + 짧은 설명.
import { Upload, Heart, Gift, ChevronRight } from "lucide-react";
import { useLang } from "./LangProvider";

export default function HomeHowItWorks() {
  const { t } = useLang();
  const steps = [
    { icon: Upload, label: t("hiw_upload"), sub: t("hiw_upload_sub") },
    { icon: Heart, label: t("hiw_vote"), sub: t("hiw_vote_sub") },
    { icon: Gift, label: t("hiw_win"), sub: t("hiw_win_sub") },
  ];
  return (
    <section className="rounded-[18px] bg-surface-1 p-4 ring-1 ring-hairline">
      <h3 className="mb-4 text-center text-[12px] font-black uppercase tracking-[0.14em] text-subtle">{t("hiw_title")}</h3>
      <div className="flex items-start">
        {steps.map((s, i) => (
          <div key={i} className="flex flex-1 items-start">
            <div className="flex flex-1 flex-col items-center gap-2 text-center">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary/12 ring-1 ring-primary/25">
                <s.icon className="h-5 w-5 text-primary-400" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white">
                  {i + 1}
                </span>
              </div>
              <div>
                <p className="text-[13px] font-black">{s.label}</p>
                <p className="mt-0.5 text-[11px] leading-tight text-muted break-keep">{s.sub}</p>
              </div>
            </div>
            {i < steps.length - 1 && <ChevronRight className="mt-3.5 h-4 w-4 shrink-0 text-subtle" />}
          </div>
        ))}
      </div>
    </section>
  );
}
