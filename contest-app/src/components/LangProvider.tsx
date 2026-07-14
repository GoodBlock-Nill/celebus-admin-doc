"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type Lang, messages } from "@/lib/i18n";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string) => string;
}

const Ctx = createContext<LangCtx>({ lang: "ko", setLang: () => {}, t: (k) => k });

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ko");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cfs_lang") as Lang | null;
      if (saved && (saved === "ko" || saved === "en" || saved === "ja")) {
        setLangState(saved);
        return;
      }
      const n = (navigator.language || "ko").slice(0, 2).toLowerCase();
      setLangState(n === "ja" ? "ja" : n === "ko" ? "ko" : "en");
    } catch {
      /* keep ko */
    }
  }, []);

  // 문서 lang 속성 동기화 (스크린리더 정확도·접근성)
  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("cfs_lang", l);
    } catch {
      /* ignore */
    }
  };

  const t = (k: string) => messages[lang][k] ?? messages.ko[k] ?? k;

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
