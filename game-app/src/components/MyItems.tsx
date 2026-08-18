"use client";

// 내 아이템 — 모드별(일반=하트 / 아이템=폭탄·라인·셔플·시간+) 그룹 + 상점과 동일한 실아트·설명 + 보유 수.
import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import { GAME_CONFIG } from "@/lib/game-config";
import { fetchAccount, type Account } from "@/lib/game-api";
import type { ItemType } from "@/lib/game-config";
import ScreenHeader from "./ScreenHeader";
import CoinBalance from "./CoinBalance";
import { useLang } from "./LangProvider";

// 아이템별 실아트 + 효과 설명 키 (상점과 동일 소스)
const ITEM_META: Record<ItemType, { art: string; descKey: string }> = {
  bomb: { art: "/items/item-bomb.png", descKey: "item_bomb_desc" },
  line: { art: "/items/item-line.png", descKey: "item_line_desc" },
  shuffle: { art: "/items/item-shuffle.png", descKey: "item_shuffle_desc" },
  time: { art: "/items/item-time.png", descKey: "item_time_desc" },
};

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

  // 아이템 카드 (실아트 + 이름 + 설명 + 보유 수). 보유 0은 흐리게.
  const ItemCard = ({ art, name, desc, count }: { art: string; name: string; desc: string; count: number }) => (
    <div className={`flex items-center gap-3 rounded-[16px] bg-surface-1 p-2.5 ring-1 ring-hairline ${count === 0 ? "opacity-55" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={art} alt="" className="h-[64px] w-[64px] shrink-0 rounded-[14px] object-cover" />
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-black text-fg">{name}</div>
        <div className="mt-0.5 text-[11.5px] leading-tight text-muted break-keep">{desc}</div>
      </div>
      <div className="shrink-0 pr-1 text-right">
        {count > 0 ? (
          <div className="text-[20px] font-black tabular-nums text-primary-400">×{count}</div>
        ) : (
          <div className="text-[11px] font-bold text-subtle">{t("items_none_owned")}</div>
        )}
      </div>
    </div>
  );

  const GroupHeader = ({ title, hint }: { title: string; hint: string }) => (
    <div className="mb-2 mt-5 flex items-baseline gap-2 px-1">
      <span className="text-[13px] font-black text-fg">{title}</span>
      <span className="text-[11px] text-subtle break-keep">{hint}</span>
    </div>
  );

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-safe pb-safe pt-safe">
      <ScreenHeader title={t("items_title")} onBack={onBack} right={<CoinBalance amount={account.celeb_point} />} />

      {loading ? (
        <div className="mt-5 flex flex-col gap-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[84px] animate-pulse rounded-[16px] bg-surface-1" />
          ))}
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
          {/* 일반 매치 — 하트 이어하기 */}
          <GroupHeader title={t("items_normal_group")} hint={t("items_normal_hint")} />
          <ItemCard art="/items/heart.png" name={t("item_heart")} desc={t("item_heart_desc")} count={account.inventory.heart ?? 0} />

          {/* 아이템 매치 — 사용 아이템 */}
          <GroupHeader title={t("items_item_group")} hint={t("items_item_hint")} />
          <div className="flex flex-col gap-2.5">
            {GAME_CONFIG.items.map(({ type, labelKey }) => (
              <ItemCard key={type} art={ITEM_META[type].art} name={t(labelKey)} desc={t(ITEM_META[type].descKey)} count={account.inventory[type] ?? 0} />
            ))}
          </div>

          <button
            onClick={onOpenShop}
            className="mt-5 flex items-center justify-center gap-1.5 rounded-full bg-surface-1 py-3 text-[14px] font-bold text-fg ring-1 ring-hairline active:scale-[0.99]"
          >
            <Store className="h-4 w-4 text-primary-400" /> {t("items_more")}
          </button>
        </>
      )}
    </div>
  );
}
