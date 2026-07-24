"use client";

import { User, Package, Settings, Palette, Store, ChevronRight } from "lucide-react";
import ScreenHeader from "./ScreenHeader";
import { useLang } from "./LangProvider";

export type MoreDest = "mypage" | "items" | "settings" | "theme" | "shop";

const ITEMS: { dest: MoreDest; icon: typeof User; labelKey: string }[] = [
  { dest: "mypage", icon: User, labelKey: "more_mypage" },
  { dest: "items", icon: Package, labelKey: "more_items" },
  { dest: "shop", icon: Store, labelKey: "more_shop" },
  { dest: "settings", icon: Settings, labelKey: "more_settings" },
  { dest: "theme", icon: Palette, labelKey: "more_theme" },
];

export default function MoreMenu({ onBack, onNavigate }: { onBack: () => void; onNavigate: (d: MoreDest) => void }) {
  const { t } = useLang();
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
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary/15 text-primary-400">
              <Icon className="h-5 w-5" />
            </span>
            <span className="flex-1 text-left text-[15px] font-bold text-fg">{t(labelKey)}</span>
            <ChevronRight className="h-5 w-5 text-subtle" />
          </button>
        ))}
      </div>
    </div>
  );
}
