"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { GAME_CONFIG } from "@/lib/game-config";
import { getThemePrimary, setThemePrimary } from "@/lib/game-api";
import ScreenHeader from "./ScreenHeader";
import { useLang } from "./LangProvider";

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
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-8 pt-4">
      <ScreenHeader title={t("theme_title")} onBack={onBack} />

      <div className="mb-2 mt-5 text-[11px] font-bold text-subtle">{t("theme_accent")}</div>
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
