"use client";

// 토너먼트 메뉴 — [토너먼트][랭킹] 두 탭. 토너먼트=대회 목록, 랭킹=토너먼트별·크리에이터·D10V Pick
import { useState } from "react";
import EventList from "./EventList";
import RankingView from "./RankingView";
import { useLang } from "./LangProvider";

export default function TournamentTabs() {
  const { t } = useLang();
  const [tab, setTab] = useState<"list" | "ranking">("list");
  const TABS = [
    { k: "list" as const, label: t("rank_tab_list") },
    { k: "ranking" as const, label: t("rank_tab_ranking") },
  ];
  return (
    <div>
      <div className="mb-4 flex gap-2">
        {TABS.map((tb) => (
          <button
            key={tb.k}
            onClick={() => setTab(tb.k)}
            className={`flex-1 rounded-full py-2.5 text-[13.5px] font-extrabold transition-all active:scale-[0.98] ${
              tab === tb.k
                ? "brand-gradient text-white shadow-[0_4px_12px_-3px_rgba(108,77,230,0.5)]"
                : "bg-primary-soft/60 text-primary-strong/70"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>
      {tab === "list" ? <EventList /> : <RankingView />}
    </div>
  );
}
