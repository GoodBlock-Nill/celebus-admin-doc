"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { GAME_CONFIG } from "@/lib/game-config";
import { fetchAccount, chargePoint, buyItem, fetchCatalog, type Account } from "@/lib/game-api";
import type { ItemType } from "@/lib/game-config";
import { unlockAudio, sfxCoin } from "@/lib/sfx";
import ScreenHeader from "./ScreenHeader";
import CoinBalance from "./CoinBalance";
import { useLang } from "./LangProvider";

const CHARGE_PRESETS = [100, 500, 1000];

export default function Shop({ onBack }: { onBack: () => void }) {
  const { t } = useLang();
  const [account, setAccount] = useState<Account>({ celeb_point: 0, inventory: {} });
  const [catalog, setCatalog] = useState<Partial<Record<ItemType, number>>>({});
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    unlockAudio();
    fetchCatalog().then(setCatalog); // 가격 권위 소스(서버 카탈로그)
    fetchAccount()
      .then(setAccount)
      .finally(() => setLoading(false));
  }, []);

  const doCharge = async (amount: number) => {
    if (busy) return;
    setBusy(true);
    const bal = await chargePoint(amount);
    setBusy(false);
    if (bal == null) return toast.error(t("insufficient"));
    setAccount((a) => ({ ...a, celeb_point: bal }));
    sfxCoin();
    toast.success(t("charged"));
  };

  const doBuy = async (type: (typeof GAME_CONFIG.items)[number]["type"]) => {
    if (busy) return;
    setBusy(true);
    const res = await buyItem(type, 1);
    setBusy(false);
    if (!res.ok) return toast.error(t("insufficient"));
    setAccount(res.account);
    sfxCoin();
    toast.success(t("bought"));
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-8 pt-4">
      <ScreenHeader title={t("shop_title")} onBack={onBack} right={<CoinBalance amount={account.celeb_point} />} />

      {/* 테스트 충전 */}
      <div className="mt-5 rounded-[16px] bg-surface-1 p-4 ring-1 ring-hairline">
        <div className="mb-2 text-[12px] font-bold text-subtle">{t("charge_test")}</div>
        <div className="grid grid-cols-3 gap-2">
          {CHARGE_PRESETS.map((amt) => (
            <button
              key={amt}
              onClick={() => doCharge(amt)}
              disabled={busy}
              className="flex items-center justify-center gap-1 rounded-[12px] bg-surface-2 py-2.5 text-[13px] font-black text-fg ring-1 ring-hairline transition-transform active:scale-95 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" /> {amt.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* 아이템 목록 */}
      <div className="mt-4 flex flex-col gap-2">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[68px] animate-pulse rounded-[16px] bg-surface-1" />)
          : GAME_CONFIG.items.map(({ type, icon: Icon, labelKey, price: fallbackPrice }) => {
              const price = catalog[type] ?? fallbackPrice; // 카탈로그 우선, 없으면 config 폴백
              return (
          <div key={type} className="flex items-center gap-3 rounded-[16px] bg-surface-1 px-4 py-3 ring-1 ring-hairline">
            <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary/15 text-primary-400">
              <Icon className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <div className="text-[14px] font-bold text-fg">{t(labelKey)}</div>
              <div className="text-[11px] text-muted">
                {t("owned")} {account.inventory[type] ?? 0}
              </div>
            </div>
            <button
              onClick={() => doBuy(type)}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-black text-white transition-transform active:scale-95 disabled:opacity-50"
            >
              {t("buy")} · {price.toLocaleString()}
            </button>
          </div>
              );
            })}
      </div>

      <p className="mt-4 text-center text-[11px] text-subtle break-keep">{t("shop_hint")}</p>
    </div>
  );
}
