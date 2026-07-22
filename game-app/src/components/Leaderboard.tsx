"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Trophy } from "lucide-react";
import { fetchLeaderboard, fetchMyRank, getAvatar, topPercent, type LeaderRow, type LeaderMode, type MyRank } from "@/lib/game-api";
import Avatar from "./Avatar";
import { useLang } from "./LangProvider";

const MEDAL = ["🥇", "🥈", "🥉"];

export default function Leaderboard({ onBack }: { onBack: () => void }) {
  const { t } = useLang();
  const [mode, setMode] = useState<LeaderMode>("normal");
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [mine, setMine] = useState<MyRank | null>(null);
  const [myAvatar, setMyAvatar] = useState<string>("");

  useEffect(() => setMyAvatar(getAvatar()), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchLeaderboard(mode).then((r) => {
      if (alive) {
        setRows(r);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [mode]);

  useEffect(() => {
    fetchMyRank().then(setMine);
  }, []);

  const myRank = mode === "normal" ? mine?.normal_rank : mine?.item_rank;
  const myTotal = mode === "normal" ? mine?.normal_total : mine?.item_total;

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-8 pt-4">
      <header className="flex items-center gap-2">
        <button onClick={onBack} aria-label={t("back")} className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-hairline active:scale-95">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="flex items-center gap-1.5 font-display text-[22px] font-black">
          <Trophy className="h-5 w-5 text-gold" /> {t("lb_title")}
        </h1>
      </header>

      {/* 탭 (모드별) */}
      <div className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-surface-1 p-1 ring-1 ring-hairline">
        {(["normal", "item"] as LeaderMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-full py-2 text-[13px] font-black transition-colors ${
              mode === m ? "bg-primary text-white" : "text-muted"
            }`}
          >
            {t(m === "normal" ? "lb_normal" : "lb_item")}
          </button>
        ))}
      </div>

      {/* 내 순위 배너 */}
      <div className="mt-3 flex items-center justify-between rounded-[16px] bg-primary/12 px-4 py-3 ring-1 ring-primary/25">
        <span className="flex items-center gap-2 text-[12px] font-bold text-primary-400">
          <Avatar value={myAvatar} size="sm" />
          {t("lb_my_rank")}
        </span>
        {myRank ? (
          <span className="text-[14px] font-black">
            {myRank.toLocaleString()}
            {t("rank_unit")} · {t("top_percent").replace("{p}", String(topPercent(myRank, myTotal || 0)))}
          </span>
        ) : (
          <span className="text-[12px] text-muted">{t("lb_unranked")}</span>
        )}
      </div>

      {/* 리스트 */}
      <div className="mt-3 flex flex-col gap-1.5">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-[14px] bg-surface-1" />)
        ) : rows.length === 0 ? (
          <p className="mt-10 text-center text-[13px] text-muted break-keep">{t("lb_empty")}</p>
        ) : (
          rows.map((row) => {
            const isMe = myRank === row.rank; // 근사 매칭(동점 시 상단 1건) — 강조 용도
            return (
              <div
                key={row.rank}
                className={`flex items-center gap-3 rounded-[14px] px-4 py-2.5 ring-1 ${
                  isMe ? "bg-primary/12 ring-primary/30" : "bg-surface-1 ring-hairline"
                }`}
              >
                <span className="w-6 text-center text-[15px] font-black tabular-nums">
                  {row.rank <= 3 ? MEDAL[row.rank - 1] : row.rank}
                </span>
                <Avatar value={row.avatar} size="sm" />
                <span className="flex-1 truncate text-[14px] font-bold">{row.nickname}</span>
                <span className="flex flex-col items-end leading-tight">
                  <span className="rounded-full bg-primary/15 px-1.5 text-[10px] font-black text-primary-400">
                    {t("lv_prefix")}
                    {row.level}
                  </span>
                  <span className="text-[13px] font-black tabular-nums text-fg">{row.score.toLocaleString()}</span>
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
