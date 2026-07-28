"use client";

import Link from "next/link";
import LangSwitcher from "./LangSwitcher";
import NotificationBell from "./NotificationBell";
import { useLang } from "./LangProvider";

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
        <div className="ml-auto flex items-center gap-1.5">
          <NotificationBell />
          <LangSwitcher />
        </div>
      </div>
    </header>
  );
}
