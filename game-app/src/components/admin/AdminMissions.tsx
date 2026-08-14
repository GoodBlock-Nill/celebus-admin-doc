"use client";

// 오늘의 미션 전용 폼 — missions 오버레이(풀 미션별 목표·보상 CP, 일일 노출 개수) 편집.
// 서버 RPC(game_mission_status)가 game_config.missions를 읽으므로 저장 즉시 다음 조회부터 반영.
// 미션 풀 구성(종류 추가/삭제)은 코드 정의 6종 고정 — 여기서는 수치만 튜닝한다.
import { RotateCcw } from "lucide-react";
import { GAME_CONFIG, type MissionId } from "@/lib/game-config";
import { Card, INPUT } from "./ui";

export type MissionRow = { id: MissionId; goal: number; cp: number };
export type MissionsOverlay = { count?: number; pool?: MissionRow[] };

// 유저 화면 문구와 동일한 의미의 관리자 라벨 (i18n mission_* 대응)
const MISSION_LABEL: Record<MissionId, { name: string; goalUnit: string }> = {
  plays: { name: "플레이 (모드 무관)", goalUnit: "판" },
  score: { name: "오늘 누적 점수", goalUnit: "점" },
  level: { name: "최고 레벨 도달", goalUnit: "레벨" },
  high: { name: "한 판 최고 점수", goalUnit: "점" },
  item: { name: "아이템 매치", goalUnit: "판" },
  normal: { name: "일반 매치", goalUnit: "판" },
};

const int = (v: string) => Math.floor(Number(v) || 0);

export default function AdminMissions({
  value,
  onChange,
}: {
  value: MissionsOverlay | undefined;
  onChange: (v: MissionsOverlay | undefined) => void;
}) {
  const defaults = GAME_CONFIG.missions;
  const pool = value?.pool ?? defaults.pool;
  const count = value?.count ?? defaults.count;

  const patch = (p: Partial<MissionsOverlay>, removeKey?: keyof MissionsOverlay) => {
    const next: MissionsOverlay = { ...value, ...p };
    if (removeKey) delete next[removeKey];
    onChange(Object.keys(next).length === 0 ? undefined : next);
  };

  const setRow = (id: MissionId, field: "goal" | "cp", v: number) =>
    patch({ pool: pool.map((m) => (m.id === id ? { ...m, [field]: v } : m)) });

  const overridden = value?.pool !== undefined;

  return (
    <Card title="오늘의 미션">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-[14px] font-bold text-fg">미션 풀 (매일 로테이션)</h3>
        {overridden && (
          <>
            <span className="rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-bold text-gold">변경</span>
            <button type="button" onClick={() => patch({}, "pool")} title="기본값으로 되돌리기" className="text-subtle transition-colors hover:text-fg">
              <RotateCcw className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {pool.map((m) => {
          const d = defaults.pool.find((x) => x.id === m.id);
          const label = MISSION_LABEL[m.id] ?? { name: m.id, goalUnit: "" };
          return (
            <div key={m.id} className="grid grid-cols-1 items-center gap-x-3 gap-y-1 rounded-[10px] bg-surface-2 px-3 py-2 ring-1 ring-hairline sm:grid-cols-[11rem_1fr_1fr_auto]">
              <span className="text-[13.5px] font-bold text-fg">{label.name}</span>
              <label className="flex items-center gap-1.5 text-[13px] text-muted">
                <span className="w-8 shrink-0 text-subtle">목표</span>
                <input
                  value={String(m.goal)}
                  onChange={(e) => setRow(m.id, "goal", Math.max(1, int(e.target.value)))}
                  inputMode="numeric"
                  className={`${INPUT} w-full min-w-0 text-right tabular-nums`}
                />
                <span className="w-9 shrink-0">{label.goalUnit}</span>
              </label>
              <label className="flex items-center gap-1.5 text-[13px] text-muted">
                <span className="w-8 shrink-0 text-subtle">보상</span>
                <input
                  value={String(m.cp)}
                  onChange={(e) => setRow(m.id, "cp", Math.max(1, int(e.target.value)))}
                  inputMode="numeric"
                  className={`${INPUT} w-full min-w-0 text-right tabular-nums`}
                />
                <span className="w-9 shrink-0">CP</span>
              </label>
              <span className="text-[11.5px] text-subtle">
                {d && (d.goal !== m.goal || d.cp !== m.cp) ? `기본 ${d.goal}${label.goalUnit} · ${d.cp} CP` : ""}
              </span>
            </div>
          );
        })}
      </div>

      {/* 일일 노출 개수 */}
      <div className="mt-4 flex items-center gap-2 text-[13.5px] text-muted">
        <span className="w-40 shrink-0 font-bold text-fg">하루 노출 미션 수</span>
        <input
          value={value?.count !== undefined ? String(value.count) : ""}
          onChange={(e) =>
            e.target.value === ""
              ? patch({}, "count")
              : patch({ count: Math.min(pool.length, Math.max(1, int(e.target.value))) })
          }
          placeholder={`기본값 ${defaults.count}`}
          inputMode="numeric"
          className={`${INPUT} w-20 text-right tabular-nums`}
        />
        <span className="shrink-0">개 (풀 {pool.length}종 중 매일 자동 선택)</span>
      </div>

      <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
        저장하면 다음 조회부터 반영돼요. 이미 오늘 미션을 진행 중인 유저는 화면을 다시 열 때 새 목표·보상이 적용돼요 (KST 자정
        리셋과 무관하게 즉시). 하루에 지급 가능한 최대 CP = 노출 미션 보상 합이니 경제 밸런스를 함께 확인해 주세요.
      </p>
    </Card>
  );
}
