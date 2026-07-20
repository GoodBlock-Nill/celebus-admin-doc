"use client";

// 화면 최하단 푸터 — CELEBUS 앱 복귀 링크. pb 여유로 상세의 고정 CTA에 가려지지 않음.
import { ArrowUpRight } from "lucide-react";
import { useLang } from "./LangProvider";

const CELEBUS_APP_URL = process.env.NEXT_PUBLIC_CELEBUS_APP_URL ?? "https://app.celebus.xyz";

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="mx-auto max-w-2xl px-4 pt-4 pb-28">
      <a
        href={CELEBUS_APP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("nav_open_app")}
        className="flex items-center justify-center gap-1.5 rounded-[14px] bg-surface-1 px-4 py-3.5 text-[13px] font-bold text-muted ring-1 ring-hairline transition-colors hover:text-fg"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/wordmark.svg" alt="CELEBUS" className="h-[13px] w-auto opacity-70" />
        {t("nav_open_app")}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </a>
    </footer>
  );
}
