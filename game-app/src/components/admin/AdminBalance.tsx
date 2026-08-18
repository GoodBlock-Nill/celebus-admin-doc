"use client";

// 밸런스 — 좌절 구간을 데이터로 찾는 계측 화면 (피로감 개선 Wave G).
// 여기서 발견한 벽은 설정 탭의 레벨 목표(levels.*)로 튜닝하는 운영 루프를 전제로 한다.
import { useEffect, useState } from "react";
import { aget } from "@/lib/admin-api";
import { Card, Stat, DataTable, TD } from "./ui";

type LevelRow = { mode: string; level: number; runs: number; near: number; avg_prog: number | null };
type AbandonRow = { day: string; mode: string; started: number; abandoned: number };
type ChainRow = { len: number; chains: number };
type DailyRow = { day: string; players: number; runs: number };
type Balance = {
  days: number;
  levels: LevelRow[];
  abandon: AbandonRow[];
  cont: { used: number; declined: number; timeout: number; avg_continues: number };
  chains: ChainRow[];
  daily: DailyRow[];
  coverage: { total: number; with_telemetry: number };
};

const MODE_LABEL: Record<string, string> = { daily: "일반 매치", free: "아이템 매치" };
const DAY_OPTIONS = [7, 14, 30] as const;

const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : "-");

export default function AdminBalance() {
  const [days, setDays] = useState<number>(7);
  const [data, setData] = useState<Balance | null>(null);

  useEffect(() => {
    setData(null);
    aget<Balance>(`/api/admin/balance?days=${days}`).then(setData).catch(() => {});
  }, [days]);

  const levelsOf = (mode: string) => (data?.levels ?? []).filter((l) => l.mode === mode);
  // 레벨 도달 퍼널 — 레벨 L 도달 판 수 = 종료 레벨 ≥ L 판의 합
  const funnel = (rows: LevelRow[]) => {
    const maxLv = rows.reduce((m, r) => Math.max(m, r.level), 0);
    const total = rows.reduce((s, r) => s + r.runs, 0);
    return Array.from({ length: maxLv }, (_, i) => {
      const lv = i + 1;
      const reached = rows.filter((r) => r.level >= lv).reduce((s, r) => s + r.runs, 0);
      const ended = rows.find((r) => r.level === lv);
      return { lv, reached, total, ended: ended?.runs ?? 0, near: ended?.near ?? 0, avgProg: ended?.avg_prog ?? null };
    });
  };

  const ab = data?.abandon ?? [];
  const abStarted = ab.reduce((s, r) => s + r.started, 0);
  const abAbandoned = ab.reduce((s, r) => s + r.abandoned, 0);
  const cont = data?.cont;
  const contOffered = (cont?.used ?? 0) + (cont?.declined ?? 0);
  const cover = data?.coverage;

  return (
    <div className="flex flex-col gap-4">
      {/* 기간 선택 + 표본 안내 */}
      <div className="flex flex-wrap items-center gap-2">
        {DAY_OPTIONS.map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-bold ring-1 transition-colors ${
              days === d ? "bg-primary text-white ring-primary" : "bg-surface-1 text-muted ring-hairline"
            }`}
          >
            최근 {d}일
          </button>
        ))}
        {cover && (
          <span className="ml-auto text-[12px] text-subtle">
            표본 {cover.total.toLocaleString()}판 · 상세 텔레메트리 {cover.with_telemetry.toLocaleString()}판
            {cover.total > 0 && cover.with_telemetry < cover.total && " (신형 클라이언트 제출부터 기록)"}
          </span>
        )}
      </div>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="시작 후 미제출(이탈)률" value={data ? pct(abAbandoned, abStarted) : "…"} />
        <Stat label="이어하기 사용률 (제안 대비)" value={data ? pct(cont?.used ?? 0, contOffered) : "…"} />
        <Stat label="이어하기 평균 사용 수" value={data ? (cont?.avg_continues ?? 0) : "…"} />
        <Stat
          label="판당 평균 플레이어"
          value={data && data.daily.length > 0 ? Math.round((data.daily.reduce((s, r) => s + r.runs, 0) / Math.max(1, data.daily.reduce((s, r) => s + r.players, 0))) * 10) / 10 : "…"}
        />
      </div>

      {/* 레벨 퍼널 + near-miss */}
      {(["daily", "free"] as const).map((mode) => {
        const rows = funnel(levelsOf(mode));
        return (
          <Card key={mode} title={`레벨 도달 퍼널 — ${MODE_LABEL[mode]}`}>
            {rows.length === 0 ? (
              <p className="text-[13px] text-subtle">기간 내 기록 없음</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {rows.map((r) => (
                  <div key={r.lv} className="flex items-center gap-3">
                    <span className="w-14 shrink-0 text-[12.5px] font-bold text-muted">Lv {r.lv}</span>
                    <div className="h-5 min-w-0 flex-1 overflow-hidden rounded-[6px] bg-surface-2">
                      <div className="h-full rounded-[6px] bg-primary/70" style={{ width: `${Math.max(2, (r.reached / Math.max(1, r.total)) * 100)}%` }} />
                    </div>
                    <span className="w-40 shrink-0 text-right text-[12px] tabular-nums text-muted">
                      도달 {r.reached.toLocaleString()} ({pct(r.reached, r.total)}) · 종료 {r.ended.toLocaleString()}
                    </span>
                    <span className={`w-28 shrink-0 text-right text-[12px] tabular-nums ${r.ended > 0 && r.near / r.ended >= 0.3 ? "font-bold text-danger" : "text-subtle"}`}>
                      막판 좌절 {r.ended > 0 ? pct(r.near, r.ended) : "-"}
                    </span>
                  </div>
                ))}
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                  <b className="text-fg">막판 좌절</b> = 그 레벨 목표의 80% 이상까지 갔는데 시간이 끝난 판 비율. 특정 레벨에서 도달률이 급락하거나 막판 좌절이 30%를
                  넘으면(빨간 표시) <b className="text-fg">설정 탭 → 레벨 목표</b>(기본 목표·증가 폭·레벨업 보너스 시간)를 조정해 벽을 완화해요.
                </p>
              </div>
            )}
          </Card>
        );
      })}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 이탈률 추이 */}
        <Card title="시작 후 미제출(이탈) 추이">
          {ab.length === 0 ? (
            <p className="text-[13px] text-subtle">기간 내 기록 없음</p>
          ) : (
            <DataTable head={["날짜", "모드", "시작", "미제출", "이탈률"]}>
              {ab.map((r, i) => (
                <tr key={i} className="border-t border-hairline">
                  <td className={TD}>{r.day}</td>
                  <td className={TD}>{MODE_LABEL[r.mode] ?? r.mode}</td>
                  <td className={`${TD} tabular-nums`}>{r.started.toLocaleString()}</td>
                  <td className={`${TD} tabular-nums`}>{r.abandoned.toLocaleString()}</td>
                  <td className={`${TD} tabular-nums ${r.started > 0 && r.abandoned / r.started >= 0.3 ? "font-bold text-danger" : ""}`}>{pct(r.abandoned, r.started)}</td>
                </tr>
              ))}
            </DataTable>
          )}
          <p className="mt-2 text-[12.5px] text-muted">판을 시작(보드 발급)하고 결과 제출 없이 떠난 비율이에요. 상승 추세면 의욕 저하의 조기 신호예요.</p>
        </Card>

        {/* 재도전 체인 */}
        <Card title="재도전 체인 (일반 매치)">
          {(data?.chains ?? []).length === 0 ? (
            <p className="text-[13px] text-subtle">기간 내 기록 없음</p>
          ) : (
            <DataTable head={["연속 판수", "발생 횟수"]}>
              {(data?.chains ?? []).map((c) => (
                <tr key={c.len} className="border-t border-hairline">
                  <td className={TD}>{c.len >= 10 ? "10판 이상" : `${c.len}판`}</td>
                  <td className={`${TD} tabular-nums`}>{c.chains.toLocaleString()}</td>
                </tr>
              ))}
            </DataTable>
          )}
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
            같은 유저가 10분 안에 쉬지 않고 이어서 한 판수예요. 긴 체인이 많으면 &ldquo;한판만 더&rdquo; 압박이 과열된 상태 — 피로 누적의 대표 신호예요.
          </p>
        </Card>
      </div>

      {/* 일 추이 */}
      <Card title="일별 활성·판수 추이">
        {(data?.daily ?? []).length === 0 ? (
          <p className="text-[13px] text-subtle">기간 내 기록 없음</p>
        ) : (
          <DataTable head={["날짜", "활성 플레이어", "판수", "인당 판수"]}>
            {(data?.daily ?? []).map((r) => (
              <tr key={r.day} className="border-t border-hairline">
                <td className={TD}>{r.day}</td>
                <td className={`${TD} tabular-nums`}>{r.players.toLocaleString()}</td>
                <td className={`${TD} tabular-nums`}>{r.runs.toLocaleString()}</td>
                <td className={`${TD} tabular-nums`}>{r.players > 0 ? (r.runs / r.players).toFixed(1) : "-"}</td>
              </tr>
            ))}
          </DataTable>
        )}
        <p className="mt-2 text-[12.5px] text-muted">인당 판수가 며칠 연속 내려가면 피로 이탈 전조예요. 이벤트·보상보다 먼저 레벨 곡선 완화를 검토해요.</p>
      </Card>
    </div>
  );
}
