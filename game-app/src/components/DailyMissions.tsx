"use client";

// 오늘의 미션 위젯 (홈) — 기본 접힘(한 줄 요약, 화면 답답함 방지), 탭으로 펼침.
// 미션은 서버가 풀에서 매일 3개 로테이션(KST). 받을 보상 있으면 자동 펼침 + 골드 뱃지.
import { useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, Target } from "lucide-react";
import { toast } from "sonner";
import { sfxCoin } from "@/lib/sfx";
import { useLang } from "./LangProvider";

type MissionRow = { id: string; value: number; goal: number; cp: number; claimed: boolean };
type Status = { day?: string; missions?: MissionRow[] };

// 미션 id별 문구 키 (goal 값 {n} 치환)
const LABEL_KEY: Record<string, string> = {
  plays: "mission_plays",
  score: "mission_score",
  level: "mission_level",
  high: "mission_high",
  item: "mission_item",
  normal: "mission_normal",
  sketch_draw: "mission_sketch_draw",
  sketch_guess: "mission_sketch_guess",
};

export default function DailyMissions({ onReward }: { onReward: (celebPoint: number) => void }) {
  const { t } = useLang();
  const [rows, setRows] = useState<MissionRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const load = async (autoOpen = false) => {
    try {
      const res = await fetch("/api/missions");
      const data = (await res.json()) as Status;
      const ms = data.missions ?? [];
      setRows(ms);
      // 받을 보상이 있으면 자동 펼침 (주의 환기)
      if (autoOpen && ms.some((m) => m.value >= m.goal && !m.claimed)) setOpen(true);
    } catch {
      /* 위젯은 실패 시 조용히 숨김 */
    }
  };
  useEffect(() => {
    void load(true);
  }, []);

  if (!rows || rows.length === 0) return null;

  const doneCount = rows.filter((r) => r.claimed).length;
  const claimable = rows.filter((r) => r.value >= r.goal && !r.claimed).length;

  const label = (m: MissionRow) => t(LABEL_KEY[m.id] ?? "mission_plays").replace("{n}", m.goal.toLocaleString());

  const claim = async (id: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/missions/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission: id }),
      });
      const data = await res.json();
      if (data?.status === "ok") {
        sfxCoin();
        toast.success(t("mission_got").replace("{n}", String(data.cp)));
        onReward(data.celeb_point ?? 0);
      }
    } catch {
      /* ignore */
    }
    await load();
    setBusy(false);
  };

  return (
    <div className="mx-4 rounded-[16px] bg-black/45 ring-1 ring-white/15 backdrop-blur">
      {/* 요약 줄 (항상 표시) — 탭으로 펼침/접힘 */}
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left">
        <Target className="h-4 w-4 shrink-0 text-primary-400" />
        <span className="text-[12px] font-black text-white">{t("mission_title")}</span>
        {/* 진행 도트 — 수령완료=초록 / 달성=골드 / 미달=회색 */}
        <span className="ml-0.5 flex items-center gap-1">
          {rows.map((r) => (
            <span
              key={r.id}
              className={`h-1.5 w-1.5 rounded-full ${
                r.claimed ? "bg-verified" : r.value >= r.goal ? "bg-gold" : "bg-white/20"
              }`}
            />
          ))}
        </span>
        <span className="min-w-0 flex-1" />
        {claimable > 0 ? (
          <span className="shrink-0 rounded-full bg-gold px-2 py-0.5 text-[10px] font-black text-black">
            {t("mission_claim")} {claimable}
          </span>
        ) : (
          <span className="shrink-0 text-[10px] font-bold tabular-nums text-white/40">
            {doneCount}/{rows.length}
          </span>
        )}
        <ChevronDown className={`h-4 w-4 shrink-0 text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* 펼침 — 미션별 상세 */}
      {open && (
        <div className="flex flex-col gap-1.5 px-3.5 pb-3">
          {rows.map((m) => {
            const achieved = m.value >= m.goal;
            const pct = Math.min(100, Math.round((m.value / m.goal) * 100));
            return (
              <div key={m.id} className="flex items-center gap-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11.5px] font-bold text-white/85">{label(m)}</span>
                    <span className="text-[10px] tabular-nums text-white/45">
                      {Math.min(m.value, m.goal).toLocaleString()}/{m.goal.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full ${achieved ? "bg-gold" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                {m.claimed ? (
                  <span className="flex w-[64px] shrink-0 items-center justify-center gap-1 text-[10.5px] font-bold text-verified">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {t("mission_done")}
                  </span>
                ) : achieved ? (
                  <button
                    disabled={busy}
                    onClick={() => void claim(m.id)}
                    className="w-[64px] shrink-0 rounded-full bg-gold py-1.5 text-[11px] font-black text-black active:scale-95 disabled:opacity-50"
                  >
                    {t("mission_claim")}
                  </button>
                ) : (
                  <span className="w-[64px] shrink-0 text-center text-[10.5px] font-bold tabular-nums text-white/35">+{m.cp} CP</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
