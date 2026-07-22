"use client";

import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import { GAME_CONFIG } from "@/lib/game-config";
import { fetchAccount, type Account } from "@/lib/game-api";
import ScreenHeader from "./ScreenHeader";
import CoinBalance from "./CoinBalance";
import { useLang } from "./LangProvider";

export default function MyItems({ onBack, onOpenShop }: { onBack: () => void; onOpenShop: () => void }) {
  const { t } = useLang();
  const [account, setAccount] = useState<Account>({ celeb_point: 0, inventory: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccount()
      .then(setAccount)
      .finally(() => setLoading(false));
  }, []);

  const total = Object.values(account.inventory).reduce((s, n) => s + (n ?? 0), 0);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-8 pt-4">
      <ScreenHeader title={t("items_title")} onBack={onBack} right={<CoinBalance amount={account.celeb_point} />} />

      {loading ? (
        <div className="mt-5 grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[62px] animate-pulse rounded-[16px] bg-surface-1" />)}
        </div>
      ) : total === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4">
          <p className="text-[13px] text-muted">{t("items_empty")}</p>
          <button onClick={onOpenShop} className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-3 text-[14px] font-black text-white active:scale-95">
            <Store className="h-4 w-4" /> {t("go_shop")}
          </button>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {GAME_CONFIG.items.map(({ type, icon: Icon, labelKey }) => (
              <div key={type} className="flex items-center gap-3 rounded-[16px] bg-surface-1 px-4 py-3 ring-1 ring-hairline">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary/15 text-primary-400">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <div className="text-[13px] font-bold text-fg">{t(labelKey)}</div>
                  <div className="text-[15px] font-black tabular-nums text-primary-400">×{account.inventory[type] ?? 0}</div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={onOpenShop} className="mt-4 flex items-center justify-center gap-1.5 rounded-full bg-surface-1 py-3 text-[14px] font-bold text-fg ring-1 ring-hairline active:scale-[0.99]">
            <Store className="h-4 w-4 text-primary-400" /> {t("go_shop")}
          </button>
        </>
      )}
    </div>
  );
}
