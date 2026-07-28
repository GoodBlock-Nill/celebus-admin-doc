"use client";

// 개편 홈 (W1) — 스테이지(상시 피드)가 기본, 이벤트(기존 콘테스트)는 탭. §4 화면 구조.
import { useState } from "react";
import Shell from "./Shell";
import StageList from "./StageList";
import { HomeBody } from "./HomeShell";
import { useLang } from "./LangProvider";

type Tab = "stage" | "event";

function Tabs({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const { t } = useLang();
  return (
    <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-white/6 p-1 ring-1 ring-white/10">
      {(["stage", "event"] as Tab[]).map((k) => (
        <button
          key={k}
          onClick={() => onTab(k)}
          className={`min-h-11 rounded-full text-[13.5px] font-bold transition-colors ${tab === k ? "bg-primary text-white" : "text-fg/60"}`}
        >
          {t(k === "stage" ? "stage_tab" : "event_tab")}
        </button>
      ))}
    </div>
  );
}

export default function StageHome() {
  const [tab, setTab] = useState<Tab>("stage");
  return (
    <Shell>
      <Tabs tab={tab} onTab={setTab} />
      {tab === "stage" ? <StageList /> : <HomeBody />}
    </Shell>
  );
}
