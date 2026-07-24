"use client";

// 리더보드 관리 — 모드 × 기간(이번/지난 주·월·전체) + 유저 단위 기록 삭제(치터 제거)
// 보상 이벤트 정산: 지난 주/지난 달 프리셋 조회 + CSV 내보내기(순위·닉네임·레벨·점수·계정 키)
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { aget, asend } from "@/lib/admin-api";
import Avatar from "../Avatar";
import { BTN_DANGER, BTN_GHOST, Card, fmtDate } from "./ui";

type Row = { rank: number; player_hash: string; nickname: string; avatar: string | null; level: number; score: number; created_at: string; flagged?: boolean };

const PRESETS: { key: string; label: string }[] = [
  { key: "this_week", label: "이번 주" },
  { key: "last_week", label: "지난 주" },
  { key: "this_month", label: "이번 달" },
  { key: "last_month", label: "지난 달" },
  { key: "all", label: "전체" },
];

export default function AdminBoard() {
  const [mode, setMode] = useState<"daily" | "free">("daily");
  const [preset, setPreset] = useState("this_week");
  const [rows, setRows] = useState<Row[]>([]);
  const [armed, setArmed] = useState<string | null>(null); // 2단계 삭제 confirm
  const [busy, setBusy] = useState(false);

  const load = async () => setRows(await aget<Row[]>(`/api/admin/leaderboard?mode=${mode}&preset=${preset}`));
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, preset]);

  const remove = async (h: string) => {
    if (armed !== h) {
      setArmed(h);
      setTimeout(() => setArmed((a) => (a === h ? null : a)), 3000);
      return;
    }
    setBusy(true);
    await asend("/api/admin/scores-delete", "POST", { player_hash: h, mode });
    setArmed(null);
    await load();
    setBusy(false);
  };

  // 보상 정산용 CSV (엑셀 호환 BOM 포함)
  const exportCsv = () => {
    const head = "rank,nickname,level,score,player_hash,achieved_at";
    const body = rows.map((r) => `${r.rank},"${r.nickname.replace(/"/g, '""')}",${r.level},${r.score},${r.player_hash},${r.created_at}`);
    const blob = new Blob(["﻿" + [head, ...body].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `celebmatch_${mode === "daily" ? "normal" : "item"}_${preset}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Card
      title="리더보드"
      right={
        <div className="flex items-center gap-1.5">
          <div className="flex gap-1 rounded-full bg-surface-2 p-0.5">
            {(["daily", "free"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-full px-3 py-1 text-[11.5px] font-bold ${mode === m ? "bg-primary text-white" : "text-muted"}`}
              >
                {m === "daily" ? "일반" : "아이템"}
              </button>
            ))}
          </div>
          <button onClick={exportCsv} disabled={rows.length === 0} className={BTN_GHOST} aria-label="CSV 내보내기">
            <Download className="h-4 w-4" />
          </button>
        </div>
      }
    >
      {/* 기간 프리셋 — 보상 이벤트 정산은 '지난 주/지난 달' 사용 (KST, 주간=월요일 시작) */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={`rounded-full px-3 py-1.5 text-[11.5px] font-bold ring-1 ${
              preset === p.key ? "bg-primary/15 text-primary-400 ring-primary/40" : "bg-surface-2 text-muted ring-hairline"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        {rows.map((r) => (
          <div key={r.player_hash} className="flex items-center gap-2.5 rounded-[12px] bg-surface-2 px-3 py-2">
            <span className="w-7 text-center text-[13px] font-black tabular-nums">{r.rank}</span>
            <Avatar value={r.avatar} size="sm" />
            <span className="min-w-0 flex-1 truncate text-[13px] font-bold">
              {r.nickname}
              {r.flagged && <span title="이상 제출 의심 (제출 간격 < 최소 판 길이)" className="ml-1 text-[11px]">⚠️</span>}
            </span>
            <span className="text-[11px] font-black text-primary-400">Lv.{r.level}</span>
            <span className="w-16 text-right text-[13px] font-black tabular-nums">{r.score.toLocaleString()}</span>
            <span className="hidden text-[10.5px] text-subtle sm:block">{fmtDate(r.created_at).slice(0, 12)}</span>
            <button disabled={busy} onClick={() => void remove(r.player_hash)} className={BTN_DANGER}>
              {armed === r.player_hash ? "확인 삭제" : "삭제"}
            </button>
          </div>
        ))}
        {rows.length === 0 && <p className="py-6 text-center text-[12px] text-subtle">기간 내 기록 없음</p>}
      </div>
      <p className="mt-3 text-[11px] leading-snug text-subtle">주간 = 월요일 00:00(KST) 시작 · 월간 = 1일 00:00(KST) 시작 · 순위 = 기간 내 (최고 레벨, 점수), 동률은 선도달 우선</p>
    </Card>
  );
}
