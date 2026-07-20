"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import LangSwitcher from "./LangSwitcher";
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
          <span className="font-display text-[16px] font-black tracking-tight text-white">FanStage</span>
        </Link>
        <div className="ml-auto flex items-center gap-1.5">
          <a
            href={CELEBUS_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("nav_open_app")}
            className="inline-flex items-center gap-0.5 rounded-full bg-surface-2 px-2.5 py-1 text-[12px] font-bold text-muted transition-colors hover:text-fg"
          >
            CELEBUS <ArrowUpRight className="h-3 w-3" />
          </a>
          <LangSwitcher />
        </div>
      </div>
    </header>
  );
}
