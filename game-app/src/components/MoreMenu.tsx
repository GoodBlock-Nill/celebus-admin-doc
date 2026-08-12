"use client";

import { useEffect, useState } from "react";
import { User, Package, Settings, Palette, Store, Gift, ChevronRight } from "lucide-react";
import { GAME_CONFIG } from "@/lib/game-config";
import { fetchMyPrizes } from "@/lib/game-api";
import ScreenHeader from "./ScreenHeader";
import { useLang } from "./LangProvider";

export type MoreDest = "mypage" | "items" | "shop" | "prizes" | "settings" | "theme";

const ITEMS: { dest: MoreDest; icon: typeof User; labelKey: string }[] = [
  { dest: "mypage", icon: User, labelKey: "more_mypage" },
  { dest: "prizes", icon: Gift, labelKey: "more_prizes" },
  { dest: "items", icon: Package, labelKey: "more_items" },
  { dest: "shop", icon: Store, labelKey: "more_shop" },
  { dest: "settings", icon: Settings, labelKey: "more_settings" },
  { dest: "theme", icon: Palette, labelKey: "more_theme" },
];

export default function MoreMenu({ onBack, onNavigate }: { onBack: () => void; onNavigate: (d: MoreDest) => void }) {
  const { t } = useLang();
  // 수령 정보 미입력 당첨 건 — 홈 반복 모달 대신 여기 뱃지로 안내 (기한 유실 방지)
  const [pendingPrizes, setPendingPrizes] = useState(0);
  useEffect(() => {
    fetchMyPrizes().then((ws) => setPendingPrizes(ws.filter((w) => w.status === "pending").length));
  }, []);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-safe pb-safe pt-safe">
      <ScreenHeader title={t("more_title")} onBack={onBack} />
      <div className="mt-5 flex flex-col gap-2">
        {ITEMS.map(({ dest, icon: Icon, labelKey }) => (
          <button
            key={dest}
            onClick={() => onNavigate(dest)}
            className="flex items-center gap-3 rounded-[16px] bg-surface-1 px-4 py-4 ring-1 ring-hairline transition-transform active:scale-[0.99]"
          >
            <span className="relative flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary/15 text-primary-400">
              <Icon className="h-5 w-5" />
              {dest === "prizes" && pendingPrizes > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9.5px] font-black text-white">
                  {pendingPrizes}
                </span>
              )}
            </span>
            <span className="flex-1 text-left text-[15px] font-bold text-fg">{t(labelKey)}</span>
            <ChevronRight className="h-5 w-5 text-subtle" />
          </button>
        ))}
      </div>

      {/* 베타 안내 — 정식 전환 시 home.beta=false로 미노출 */}
      {GAME_CONFIG.home.beta && (
        <p className="mt-auto pb-2 pt-8 text-center text-[11px] leading-relaxed text-subtle break-keep">
          <span className="mr-1.5 rounded-full bg-gold/90 px-1.5 py-0.5 text-[9px] font-black text-black">BETA</span>
          {t("beta_note")}
        </p>
      )}
    </div>
  );
}
