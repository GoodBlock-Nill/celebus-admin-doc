"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GAME_CONFIG } from "@/lib/game-config";
import { fetchAccount, buyItem, fetchCatalog, fetchGachaWallet, buyGachaTicket, type Account, type GachaWallet } from "@/lib/game-api";
import type { ItemType, ShopItemType } from "@/lib/game-config";
import { unlockAudio, sfxCoin } from "@/lib/sfx";
import DrawTicketIcon from "./DrawTicketIcon";
import ScreenHeader from "./ScreenHeader";
import CoinBalance from "./CoinBalance";
import { useLang } from "./LangProvider";

// 아이템별 카드 아트(일러스트) + 효과 설명 키 (효과는 게임 로직 기준)
const ITEM_META: Record<ItemType, { art: string; descKey: string }> = {
  bomb: { art: "/items/item-bomb.png", descKey: "item_bomb_desc" },
  line: { art: "/items/item-line.png", descKey: "item_line_desc" },
  shuffle: { art: "/items/item-shuffle.png", descKey: "item_shuffle_desc" },
  time: { art: "/items/item-time.png", descKey: "item_time_desc" },
};

export default function Shop({ onBack }: { onBack: () => void }) {
  const { t } = useLang();
  const [account, setAccount] = useState<Account>({ celeb_point: 0, inventory: {} });
  const [catalog, setCatalog] = useState<Partial<Record<ShopItemType, number>>>({});
  const [tickets, setTickets] = useState<GachaWallet>({ free_tickets: 0, paid_tickets: 0 });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    unlockAudio();
    fetchCatalog().then(setCatalog); // 가격 권위 소스(서버 카탈로그)
    fetchGachaWallet().then(setTickets);
    fetchAccount()
      .then(setAccount)
      .finally(() => setLoading(false));
  }, []);

  const doBuy = async (type: ShopItemType) => {
    if (busy) return;
    setBusy(true);
    const res = await buyItem(type, 1);
    setBusy(false);
    if (!res.ok) return toast.error(t("insufficient"));
    setAccount(res.account);
    sfxCoin();
    toast.success(t("bought"));
  };

  // 가챠 이용권 구매 (유상 — 재화 뽑기 전용, 가격은 서버 RPC가 config에서 재검증)
  const doBuyTicket = async () => {
    if (busy) return;
    setBusy(true);
    const res = await buyGachaTicket(1);
    setBusy(false);
    if (!res.ok) return toast.error(t("insufficient"));
    setAccount((a) => ({ ...a, celeb_point: res.celeb_point }));
    setTickets(res.wallet);
    sfxCoin();
    toast.success(t("bought"));
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-safe pb-safe pt-safe">
      <ScreenHeader title={t("shop_title")} onBack={onBack} right={<CoinBalance amount={account.celeb_point} />} />

      {/* 하트 (일반 매치 이어하기) — 강조 상품 */}
      {!loading && (
        <div className="mt-5 flex items-center gap-3 rounded-[16px] bg-gradient-to-r from-primary/20 to-surface-1 p-2.5 ring-1 ring-primary/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/items/heart.png" alt="" className="h-[72px] w-[72px] shrink-0 rounded-[14px] object-contain" />
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-black text-fg">{t("item_heart")}</div>
            <div className="mt-0.5 text-[11px] leading-tight text-muted break-keep">{t("item_heart_desc")}</div>
            <div className="mt-1 text-[10px] font-bold text-subtle">
              {t("owned")} {account.inventory.heart ?? 0}
            </div>
          </div>
          <button
            onClick={() => doBuy("heart")}
            disabled={busy}
            className="flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-[14px] font-black text-white ring-1 ring-white/15 transition-transform active:scale-95 disabled:opacity-50"
            style={{ background: "linear-gradient(180deg, #ec5c9a 0%, #c03c78 100%)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/currency.png" alt="" className="h-4 w-4" />
            <span className="tabular-nums">{(catalog.heart ?? GAME_CONFIG.hearts.price).toLocaleString()}</span>
          </button>
        </div>
      )}

      {/* 가챠 이용권 (유상 — 재화 뽑기 전용) */}
      {!loading && (
        <div className="mt-2.5 flex items-center gap-3 rounded-[16px] bg-surface-1 p-2.5 ring-1 ring-hairline">
          <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[14px] bg-primary/15">
            <DrawTicketIcon className="h-12 w-12" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-black text-fg">{t("gacha_ticket")}</div>
            <div className="mt-0.5 text-[11px] leading-tight text-muted break-keep">{t("gacha_ticket_desc")}</div>
            <div className="mt-1 text-[10px] font-bold text-subtle">
              {t("owned")} {(tickets.free_tickets + tickets.paid_tickets).toLocaleString()}
            </div>
          </div>
          <button
            onClick={doBuyTicket}
            disabled={busy}
            className="flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-[14px] font-black text-white ring-1 ring-white/15 transition-transform active:scale-95 disabled:opacity-50"
            style={{ background: "linear-gradient(180deg, #7c5cf0 0%, #5a3cc0 100%)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/currency.png" alt="" className="h-4 w-4" />
            <span className="tabular-nums">{GAME_CONFIG.rewards.ticketPrice.toLocaleString()}</span>
          </button>
        </div>
      )}

      {/* 아이템 목록 (1열 리스트 — 정사각 썸네일 + 정보 + 구매) */}
      <div className="mt-2.5 flex flex-col gap-2.5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-[92px] animate-pulse rounded-[16px] bg-surface-1" />)
          : GAME_CONFIG.items.map(({ type, labelKey, price: fallbackPrice }) => {
              const price = catalog[type] ?? fallbackPrice; // 카탈로그 우선, 없으면 config 폴백
              const meta = ITEM_META[type];
              const owned = account.inventory[type] ?? 0;
              return (
                <div key={type} className="flex items-center gap-3 rounded-[16px] bg-surface-1 p-2.5 ring-1 ring-hairline">
                  {/* 썸네일 (정사각 원본 → object-cover 잘림 없음) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={meta.art} alt="" className="h-[72px] w-[72px] shrink-0 rounded-[14px] object-cover" />
                  {/* 정보 */}
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-black text-fg">{t(labelKey)}</div>
                    <div className="mt-0.5 text-[11px] leading-tight text-muted break-keep">{t(meta.descKey)}</div>
                    <div className="mt-1 text-[10px] font-bold text-subtle">
                      {t("owned")} {owned}
                    </div>
                  </div>
                  {/* 구매 */}
                  <button
                    onClick={() => doBuy(type)}
                    disabled={busy}
                    className="flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-[14px] font-black text-white ring-1 ring-white/15 transition-transform active:scale-95 disabled:opacity-50"
                    style={{ background: "linear-gradient(180deg, #7c5cf0 0%, #5a3cc0 100%)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/currency.png" alt="" className="h-4 w-4" />
                    <span className="tabular-nums">{price.toLocaleString()}</span>
                  </button>
                </div>
              );
            })}
      </div>

      <p className="mt-5 text-center text-[11px] text-subtle break-keep">{t("shop_hint")}</p>
    </div>
  );
}
