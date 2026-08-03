"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import LangSwitcher from "./LangSwitcher";
import NotificationBell from "./NotificationBell";
import { useLang } from "./LangProvider";

const CELEBUS_APP_URL = process.env.NEXT_PUBLIC_CELEBUS_APP_URL ?? "https://app.celebus.xyz";

export default function Header() {
  const { t } = useLang();
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-bg/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-2xl flex-col gap-1.5 px-4 pb-2.5 pt-[max(0.5rem,env(safe-area-inset-top))]">
        {/* 윗줄 — 상위 앱(CELEBUS) 복귀 + 언어 (홈에서만 노출) */}
        {isHome && (
          <div className="flex items-center justify-between">
            <a
              href={CELEBUS_APP_URL}
              aria-label={t("nav_open_app")}
              className="-ml-1 flex items-center gap-0.5 rounded-full py-1 pl-1 pr-2 text-muted transition-colors hover:text-fg active:scale-95"
            >
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span className="text-[11.5px] font-bold tracking-wide">CELEBUS</span>
            </a>
            <LangSwitcher />
          </div>
        )}

        {/* 아랫줄 — 메인 로고·타이틀 + 알림 */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            aria-label={t("nav_home_aria")}
            className="flex items-center transition-opacity hover:opacity-80"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {/* 헤더 로고는 상단 고정 노출 → eager + 명시 크기(1412×128, 약 220×20)로 레이아웃 이동 방지 */}
            <img src="/logo.png" alt="CELEBUS MOMENT" width={220} height={20} className="h-5 w-auto shrink-0" />
          </Link>
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
