"use client";

import { useEffect, useState } from "react";
import { Trophy, Gift } from "lucide-react";
import { sb } from "@/lib/supabase-browser";
import type { PrizePublic } from "@/lib/types";
import { useLang } from "./LangProvider";
import ClaimModal from "./ClaimModal";

const CS_KEY: Record<string, string> = { none: "cs_none", claimed: "cs_claimed", shipped: "cs_shipped" };

// 🏆 명예의 전당 / 이번 회차 발표 — 채택·당첨 팬 목소리, 본인은 보상 수령
export default function RewardsSection() {
  const { t } = useLang();
  const [list, setList] = useState<PrizePublic[]>([]);
  const [round, setRound] = useState<string>("");
  const [claim, setClaim] = useState<PrizePublic | null>(null);

  async function load() {
    const { data } = await sb.from("prizes_public").select("*").order("created_at", { ascending: false }).limit(60);
    const rows = (data as PrizePublic[]) ?? [];
    const latest = rows[0]?.round ?? "";
    setRound(latest);
    setList(rows.filter((r) => r.round === latest));
  }

  useEffect(() => {
    void load();
  }, []);

  if (list.length === 0) return null; // 발표 전에는 숨김

  return (
    <>
      <section className="mt-8 rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-400/10 via-card to-primary/10 p-5">
        <h2 className="flex items-center gap-1.5 text-[15px] font-black">
          <Trophy className="h-4 w-4 text-amber-300" /> {t("sec_rewards")}
          {round && <span className="font-medium text-muted">· {round}</span>}
        </h2>
        <p className="mt-1 text-[13px] text-muted">{t("rewards_sub")}</p>

        <div className="mt-3 grid gap-2">
          {list.map((pz) => (
            <div key={pz.id} className="flex items-center gap-2 rounded-2xl border border-border bg-card/60 p-3">
              <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                {pz.type === "curated" ? t("prize_curated") : t("prize_raffle")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">@{pz.nickname}</p>
                <p className="flex items-center gap-1 truncate text-[12px] text-muted">
                  <Gift className="h-3 w-3 shrink-0" /> {pz.prize}
                </p>
              </div>
              {pz.claim_status === "none" ? (
                <button
                  onClick={() => setClaim(pz)}
                  className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
                >
                  {t("claim_btn")}
                </button>
              ) : (
                <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-muted">{t(CS_KEY[pz.claim_status])}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {claim && (
        <ClaimModal
          prize={claim}
          onClose={() => setClaim(null)}
          onDone={() => {
            setClaim(null);
            void load();
          }}
        />
      )}
    </>
  );
}
