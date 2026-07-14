"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { LANGS } from "@/lib/i18n";
import { useLang } from "./LangProvider";

export default function LangSwitcher() {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const cur = LANGS.find((l) => l.code === lang);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-muted hover:border-primary/60 hover:text-fg"
        aria-label={t("lang_select_aria")}
      >
        <Globe className="h-3.5 w-3.5" />
        {lang.toUpperCase()}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-50 w-32 overflow-hidden rounded-xl border border-border bg-card-2 py-1 shadow-2xl shadow-black/50">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-white/5 ${
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
