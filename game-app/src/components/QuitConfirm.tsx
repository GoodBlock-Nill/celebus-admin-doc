"use client";

// 기권 confirm — 일시정지 없음(랭킹 공정성): 확인 중에도 타이머는 계속 흐른다.
import { useRef } from "react";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { useLang } from "./LangProvider";

export default function QuitConfirm({ onResume, onQuit }: { onResume: () => void; onQuit: () => void }) {
  const { t } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true, onResume);
  return (
    <div className="anim-backdrop-in fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={t("quit_title")}
        tabIndex={-1}
        className="anim-pop-in w-full max-w-xs rounded-[22px] bg-surface-2 p-6 text-center outline-none ring-1 ring-hairline"
      >
        <div className="text-[16px] font-black">{t("quit_title")}</div>
        <p className="mb-5 mt-2 text-[13px] leading-relaxed text-muted break-keep">{t("quit_desc")}</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onResume}
            className="w-full rounded-full bg-primary py-3 text-[15px] font-black text-white active:scale-[0.99]"
          >
            {t("quit_resume")}
          </button>
          <button
            onClick={onQuit}
            className="w-full rounded-full bg-surface-1 py-3 text-[14px] font-bold text-danger ring-1 ring-hairline active:scale-[0.99]"
          >
            {t("quit_confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
