"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { LANGS } from "@/lib/i18n";
import { useLang } from "./LangProvider";

// variant "ghost" — 스케치 홈처럼 밝은 배경의 슬림 상단 바용. 상위 앱 복귀 버튼과 같은 무게의 텍스트 버튼.
export default function LangSwitcher({ variant = "default" }: { variant?: "default" | "ghost" }) {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const cur = LANGS.find((l) => l.code === lang);
  const ghost = variant === "ghost";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={
          ghost
            ? "flex min-h-11 items-center gap-1 rounded-full py-1 pl-2.5 pr-1.5 text-[11.5px] font-bold tracking-wide text-muted transition-colors active:scale-95 hover:text-fg"
            : "flex min-h-11 items-center gap-1 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-muted hover:border-primary/60 hover:text-fg"
        }
        aria-label={t("lang_select_aria")}
      >
        <Globe className={ghost ? "h-4 w-4" : "h-3.5 w-3.5"} />
        {lang.toUpperCase()}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={`absolute right-0 top-full mt-1 z-50 w-32 overflow-hidden rounded-xl border border-border bg-card-2 py-1 ${
              ghost ? "shadow-lg shadow-black/15" : "shadow-2xl shadow-black/50"
            }`}
          >
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-2 text-left text-sm ${ghost ? "hover:bg-black/5" : "hover:bg-white/5"} ${
                  l.code === lang ? "text-primary-400 font-bold" : "text-fg/90"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </>
      )}
      {cur && <span className="sr-only">{cur.label}</span>}
    </div>
  );
}
