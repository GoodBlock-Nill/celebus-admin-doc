"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type Lang, messages } from "@/lib/i18n";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string) => string;
}

const Ctx = createContext<LangCtx>({ lang: "ko", setLang: () => {}, t: (k) => k });

function writeLangCookie(l: Lang) {
  try {
    // 서버가 SSR 시 이 쿠키로 언어를 결정한다(1년 유지)
    document.cookie = `cfs_lang=${l}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    /* ignore */
  }
}
function readLangCookie(): Lang | null {
  try {
    const m = document.cookie.match(/(?:^|;\s*)cfs_lang=(ko|en|ja)/);
    return (m?.[1] as Lang) ?? null;
  } catch {
    return null;
  }
}

// initialLang: 서버(page)에서 쿠키로 읽어 넘긴 값 → 초기 상태로 써서 하이드레이션 불일치를 막는다.
export function LangProvider({ children, initialLang }: { children: React.ReactNode; initialLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(initialLang ?? "ko");

  useEffect(() => {
    const cookie = readLangCookie();
    if (cookie) {
      if (cookie !== lang) setLangState(cookie);
      return;
    }
    // 첫 방문(쿠키 없음) — 기존 localStorage 마이그레이션 or navigator 감지 후 쿠키를 심는다.
    try {
      const saved = localStorage.getItem("cfs_lang") as Lang | null;
      const detected: Lang =
        saved && (saved === "ko" || saved === "en" || saved === "ja")
          ? saved
          : (() => {
              const n = (navigator.language || "ko").slice(0, 2).toLowerCase();
              return n === "ja" ? "ja" : n === "ko" ? "ko" : "en";
            })();
      setLangState(detected);
      localStorage.setItem("cfs_lang", detected);
      writeLangCookie(detected);
    } catch {
      /* keep ko */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    writeLangCookie(l);
  };

  const t = (k: string) => messages[lang][k] ?? messages.ko[k] ?? k;

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
