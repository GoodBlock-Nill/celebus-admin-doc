"use client";

import LangSwitcher from "./LangSwitcher";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/symbol.svg" alt="" className="h-6 w-6 shrink-0" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/wordmark.svg" alt="CELEBUS" className="h-[15px] w-auto shrink-0" />
        <span className="text-[15px] font-black italic tracking-tight text-white">FanVoice</span>
        <div className="ml-auto">
          <LangSwitcher />
        </div>
      </div>
    </header>
  );
}
