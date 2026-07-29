"use client";

// 홈 온보딩 — "올리면 멤버가 봐준다"는 코어 루프를 3스텝으로 명시(Q2 컨셉 전달).
// forced=false: 최초 1회만(닫으면 localStorage 기억). forced=true: 빈 상태에서 항상 노출.
import { useEffect, useState } from "react";
import { Upload, Heart, Trophy, X } from "lucide-react";
import { useLang } from "./LangProvider";

const STEPS = [
  { icon: Upload, titleKey: "hiw1_title", subKey: "hiw1_sub" },
  { icon: Heart, titleKey: "hiw2_title", subKey: "hiw2_sub" },
  { icon: Trophy, titleKey: "hiw3_title", subKey: "hiw3_sub" },
] as const;

export default function HowItWorks({ forced = false }: { forced?: boolean }) {
  const { t } = useLang();
  const [show, setShow] = useState(forced);

  useEffect(() => {
    if (forced) return;
    try {
      setShow(localStorage.getItem("moment_hiw_seen") !== "1");
    } catch {
      /* 스토리지 불가 시 노출 */
    }
  }, [forced]);

  if (!show) return null;

  function dismiss() {
    try {
      localStorage.setItem("moment_hiw_seen", "1");
    } catch {
      /* noop */
    }
    setShow(false);
  }

  return (
    <div className="relative mt-1 rounded-2xl border border-[#e2d6ff] bg-primary-soft/60 p-3.5">
      {!forced && (
        <button
          onClick={dismiss}
          aria-label={t("hiw_new_dismiss")}
          className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full text-primary-strong/55 hover:text-primary-strong"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <div className="mb-2.5 text-[11px] font-extrabold uppercase tracking-wider text-primary-strong">{t("hiw_new_title")}</div>
      <div className="flex gap-2">
        {STEPS.map((st, i) => {
          const Icon = st.icon;
          return (
            <div key={st.titleKey} className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
                </span>
                <span className="text-[10px] font-black text-primary-strong/70">{i + 1}</span>
              </div>
              <div className="mt-1.5 text-[11.5px] font-bold leading-tight text-fg">{t(st.titleKey)}</div>
              <div className="mt-0.5 text-[10.5px] leading-snug text-muted">{t(st.subKey)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
