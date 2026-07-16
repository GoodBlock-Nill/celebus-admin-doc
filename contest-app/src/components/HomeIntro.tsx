"use client";

// 홈 상단 인트로 — 팬스테이지가 무엇이고 어떻게 참여하는지 3단계로 안내.
import { Upload, Heart, Gift } from "lucide-react";
import { useLang } from "./LangProvider";

export default function HomeIntro() {
  const { t } = useLang();
  const steps = [
    { icon: Upload, title: t("intro_step1_t"), desc: t("intro_step1_d") },
    { icon: Heart, title: t("intro_step2_t"), desc: t("intro_step2_d") },
    { icon: Gift, title: t("intro_step3_t"), desc: t("intro_step3_d") },
  ];

  return (
    <section className="rounded-[22px] bg-surface-1 p-5 ring-1 ring-hairline">
      <h1 className="text-[20px] font-black leading-snug">{t("intro_title")}</h1>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{t("intro_sub")}</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {steps.map((s, i) => (
          <div key={i} className="relative rounded-[14px] bg-surface-2 px-2 py-3 text-center">
            <span className="absolute left-2 top-2 text-[10px] font-black text-subtle">{i + 1}</span>
            <span className="mx-auto mb-1.5 grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-primary-400">
              <s.icon className="h-4 w-4" />
            </span>
            <p className="text-[12px] font-black">{s.title}</p>
            <p className="mt-0.5 text-[10.5px] leading-tight text-muted">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
