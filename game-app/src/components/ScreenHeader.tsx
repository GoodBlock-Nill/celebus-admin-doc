"use client";

import { ChevronLeft } from "lucide-react";
import { useLang } from "./LangProvider";

// 하위 화면 공용 헤더 — 뒤로 버튼 + 제목 + (선택) 우측 슬롯
export default function ScreenHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
}) {
  const { t } = useLang();
  return (
    <header className="flex items-center gap-2">
      <button onClick={onBack} aria-label={t("back")} className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-hairline active:scale-95">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <h1 className="flex-1 font-display text-[22px] font-black">{title}</h1>
      {right}
    </header>
  );
}
