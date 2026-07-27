"use client";

// 리더보드 관리 — 용도: ① 보상 정산(주간 프리셋에 순위별 보상 표시) ② 치터 제거(의심 필터·기록 삭제).
// 모드(일반/아이템) × 기간(이번/지난 주·월·전체). 주간 보상 = rewards.weeklyTop[순위-1] CP(모드별 자동 지급).
import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { aget, asend } from "@/lib/admin-api";
import { GAME_CONFIG } from "@/lib/game-config";
import Avatar from "../Avatar";
import { BTN_DANGER, BTN_GHOST, Card, DataTable, TD, TR_HOVER, fmtDate } from "./ui";

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
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [armed, setArmed] = useState<string | null>(null); // 2단계 삭제 confirm
  const [busy, setBusy] = useState(false);

  const load = async () => setRows(await aget<Row[]>(`/api/admin/leaderboard?mode=${mode}&preset=${preset}`));
  useEffect(() => {
    void load();
    setOnlyFlagged(false);
    setArmed(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, preset]);

  const isWeekly = preset === "this_week" || preset === "last_week";
  const rewardTable = GAME_CONFIG.rewards.weeklyTop;
  const rewardFor = (rank: number) => (isWeekly && rank <= rewardTable.length ? rewardTable[rank - 1] : 0);

  const flaggedCount = useMemo(() => rows.filter((r) => r.flagged).length, [rows]);
  const view = onlyFlagged ? rows.filter((r) => r.flagged) : rows;

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

  // 보상 정산용 CSV (엑셀 호환 BOM 포함) — 주간이면 보상 열 포함
  const exportCsv = () => {
    const head = isWeekly ? "rank,nickname,level,score,reward_cp,player_hash,achieved_at" : "rank,nickname,level,score,player_hash,achieved_at";
    const body = rows.map((r) => {
      const base = `${r.rank},"${r.nickname.replace(/"/g, '""')}",${r.level},${r.score}`;
      return isWeekly ? `${base},${rewardFor(r.rank)},${r.player_hash},${r.created_at}` : `${base},${r.player_hash},${r.created_at}`;
    });
    const blob = new Blob(["﻿" + [head, ...body].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `celebmatch_${mode === "daily" ? "normal" : "item"}_${preset}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Card
      title={`리더보드 (${view.length})`}
      right={
        <div className="flex items-center gap-1.5">
          <div className="flex gap-1 rounded-full bg-surface-2 p-0.5">
            {(["daily", "free"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-full px-3 py-1 text-[12.5px] font-bold ${mode === m ? "bg-primary text-white" : "text-muted"}`}
              >
                {m === "daily" ? "일반" : "아이템"}
              </button>
            ))}
          </div>
          <button onClick={exportCsv} disabled={rows.length === 0} className={`${BTN_GHOST} flex items-center gap-1.5`}>
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
      }
    >
      {/* 기간 프리셋 — 보상 정산은 '지난 주/지난 달' 사용 (KST, 주간=월요일 시작) */}
      <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={`rounded-full px-3 py-1.5 text-[12.5px] font-bold ring-1 ${
              preset === p.key ? "bg-primary/15 text-primary-400 ring-primary/40" : "bg-surface-2 text-muted ring-hairline"
            }`}
          >
            {p.label}
          </button>
        ))}
        {/* 의심(치터) 필터 */}
        <button
          onClick={() => setOnlyFlagged((v) => !v)}
          disabled={flaggedCount === 0}
          className={`ml-1 rounded-full px-3 py-1.5 text-[12.5px] font-bold ring-1 disabled:opacity-40 ${
            onlyFlagged ? "bg-danger/15 text-danger ring-danger/40" : "bg-surface-2 text-muted ring-hairline"
          }`}
        >
          ⚠️ 의심만 {flaggedCount > 0 ? `(${flaggedCount})` : ""}
        </button>
      </div>

      <DataTable head={["순위", "유저", "레벨", "점수", ...(isWeekly ? [preset === "last_week" ? "지급 보상" : "예상 보상"] : []), "달성 시각", ""]}>
        {view.map((r) => (
          <tr key={r.player_hash} className={TR_HOVER}>
            <td className={`${TD} w-12 text-center font-black tabular-nums`}>{r.rank}</td>
            <td className={TD}>
              <span className="flex items-center gap-2">
                <Avatar value={r.avatar} size="sm" />
                <span className="truncate font-bold">{r.nickname}</span>
                {r.flagged && (
                  <span title="이상 제출 의심 (제출 간격이 물리적 최소 판 길이보다 짧음)" className="text-[11px]">
                    ⚠️
                  </span>
                )}
              </span>
            </td>
            <td className={`${TD} whitespace-nowrap font-black text-primary-400`}>Lv.{r.level}</td>
            <td className={`${TD} whitespace-nowrap text-right font-black tabular-nums`}>{r.score.toLocaleString()}</td>
            {isWeekly && (
              <td className={`${TD} whitespace-nowrap text-right font-bold tabular-nums ${rewardFor(r.rank) > 0 ? "text-gold" : "text-subtle"}`}>
                {rewardFor(r.rank) > 0 ? `${rewardFor(r.rank)} CP` : "-"}
              </td>
            )}
            <td className={`${TD} whitespace-nowrap text-subtle`}>{fmtDate(r.created_at)}</td>
            <td className={`${TD} text-right`}>
              <button disabled={busy} onClick={() => void remove(r.player_hash)} className={BTN_DANGER}>
                {armed === r.player_hash ? "한 번 더 — 회원 기록 삭제" : "삭제"}
              </button>
            </td>
          </tr>
        ))}
      </DataTable>
      {view.length === 0 && <p className="py-6 text-center text-[13px] text-subtle">{onlyFlagged ? "의심 기록 없음" : "기간 내 기록 없음"}</p>}

      <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
        순위 = 기간 내 (최고 레벨, 점수), 동률은 선도달 우선 · 주간=월요일 00:00, 월간=1일 00:00 시작(KST). 주간 보상은 순위별 자동 지급돼요.
        <b className="text-fg"> 삭제</b>는 이 회원의 <b className="text-fg">{mode === "daily" ? "일반" : "아이템"} 매치 기록 전체</b>를 지워 랭킹에서 제외해요(되돌릴 수 없어요).
      </p>
    </Card>
  );
}
