"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import LangSwitcher from "./LangSwitcher";
import NotificationBell from "./NotificationBell";
import { useLang } from "./LangProvider";

const CELEBUS_APP_URL = process.env.NEXT_PUBLIC_CELEBUS_APP_URL ?? "https://app.celebus.xyz";

export default function Header() {
  const { t } = useLang();
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
        <Link
          href="/"
          aria-label={t("nav_home_aria")}
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/symbol.svg" alt="" className="h-6 w-6 shrink-0" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wordmark.svg" alt="CELEBUS" className="h-[15px] w-auto shrink-0" />
          <span className="brand-gradient-text font-display text-[16px] font-black tracking-tight">MOMENT</span>
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <NotificationBell />
          {/* 상위 앱(CELEBUS) 복귀 — 언어 선택과 함께 최상단 배치 (게임 앱 패턴) */}
          <a
            href={CELEBUS_APP_URL}
            aria-label={t("nav_open_app")}
            className="flex items-center gap-0.5 rounded-full py-1.5 pl-1.5 pr-2.5 text-muted transition-colors hover:text-fg active:scale-95"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="text-[11.5px] font-bold tracking-wide">CELEBUS</span>
          </a>
          <LangSwitcher />
        </div>
      </div>
    </header>
  );
}
