"use client";

import { useEffect, useState } from "react";
import { Check, Lock } from "lucide-react";
import { GAME_CONFIG } from "@/lib/game-config";
import { getThemePrimary, setThemePrimary } from "@/lib/game-api";
import ScreenHeader from "./ScreenHeader";
import { useLang } from "./LangProvider";

// 게임 테마 카드 미리보기 — 홈 배경 아트(멤버+무대) 사용, 없으면 CSS 무대 렌더 폴백
function ThemePreviewCard() {
  const bg = GAME_CONFIG.home.background;
  if (bg) {
    return (
      <div className="relative h-[230px] overflow-hidden rounded-[14px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bg} alt="" className="h-full w-full object-cover" style={{ objectPosition: "center 40%" }} />
      </div>
    );
  }
  return (
    <div className="stage-bg relative flex h-[112px] items-center justify-center overflow-hidden rounded-[14px]">
      <div className="board-frame h-[64px] w-[64px]">
        <div className="board-inner grid h-full w-full grid-cols-3 gap-[3px] p-[6px]">
          {["#8b5cf6", "#3b82f6", "#ec4899", "#22c55e", "#f59e0b", "#8b5cf6", "#3b82f6", "#22c55e", "#ec4899"].map((c, i) => (
            <span key={i} className="rounded-[3px]" style={{ background: c }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ThemeSettings({ onBack }: { onBack: () => void }) {
  const { t } = useLang();
  const [current, setCurrent] = useState<string>(GAME_CONFIG.theme.primary);

  useEffect(() => {
    setCurrent(getThemePrimary() || GAME_CONFIG.theme.primary);
  }, []);

  const pick = (primary: string) => {
    setCurrent(primary);
    setThemePrimary(primary); // 저장 + 즉시 적용
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-safe pb-safe pt-safe">
      <ScreenHeader title={t("theme_title")} onBack={onBack} />

      {/* 게임 테마 — 현재는 기본 1종 장착 고정, 추후 스킨 시스템 확장 예정(설계안 메모리 보존) */}
      <div className="mb-2 mt-5 text-[11px] font-bold text-subtle">{t("theme_game")}</div>
      <div className="rounded-[18px] bg-surface-1 p-3 ring-1 ring-primary/40">
        <ThemePreviewCard />
        <div className="mt-2.5 flex items-center justify-between px-1">
          <span className="text-[13px] font-black text-fg">{t("theme_standard")}</span>
          <span className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-black text-white">
            <Check className="h-3 w-3" strokeWidth={3} /> {t("theme_equipped")}
          </span>
        </div>
      </div>

      {/* 추후 공개 티저 — 새 테마 기대감 형성 */}
      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        {[0, 1].map((i) => (
          <div key={i} className="flex h-[76px] flex-col items-center justify-center gap-1.5 rounded-[14px] bg-surface-1/60 ring-1 ring-hairline">
            <Lock className="h-4 w-4 text-subtle" />
            <span className="text-[10.5px] font-bold text-subtle">{t("theme_soon")}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 px-1 text-[10.5px] text-subtle break-keep">{t("theme_soon_hint")}</p>

      <div className="mb-2 mt-6 text-[11px] font-bold text-subtle">{t("theme_accent")}</div>
      <div className="grid grid-cols-5 gap-3">
        {GAME_CONFIG.themePresets.map((p) => (
          <button
            key={p.id}
            onClick={() => pick(p.primary)}
            aria-label={p.label}
            aria-pressed={current.toLowerCase() === p.primary.toLowerCase()}
            className={`flex aspect-square items-center justify-center rounded-full transition-transform active:scale-90 ${
              current.toLowerCase() === p.primary.toLowerCase() ? "ring-2 ring-white/80 ring-offset-2 ring-offset-surface-0" : ""
            }`}
            style={{ background: p.primary }}
          >
            {current.toLowerCase() === p.primary.toLowerCase() && <Check className="h-5 w-5 text-white" strokeWidth={3} />}
          </button>
        ))}
      </div>
    </div>
  );
}
