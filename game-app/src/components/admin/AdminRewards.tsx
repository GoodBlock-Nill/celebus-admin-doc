"use client";

// 주간 랭킹 보상 전용 폼 — rewards 오버레이(weeklyTop CP·weeklyTickets 이용권·ticketPrice) 행 단위 편집.
// 기획: docs/weekly-rank-prize-reward-plan.md §7-3. 검증 규칙은 서버(/api/admin/config)와 동일 유지.
import { Plus, RotateCcw, X } from "lucide-react";
import { GAME_CONFIG } from "@/lib/game-config";
import { BTN_GHOST, Card, INPUT } from "./ui";

export type TicketTier = { from: number; to: number; tickets: number };
export type WeeklyTickets = { tiers: TicketTier[]; others: number };
export type RewardsOverlay = { weeklyTop?: number[]; weeklyTickets?: WeeklyTickets; ticketPrice?: number };

export const MAX_TOP_ROWS = 50;
export const MAX_TIER_ROWS = 20;

// 이용권 구간 검증 — 실패 사유 문자열, 통과 시 null
export function tiersError(tiers: TicketTier[]): string | null {
  if (tiers.length > MAX_TIER_ROWS) return `구간은 최대 ${MAX_TIER_ROWS}개까지예요.`;
  for (const t of tiers) {
    if (![t.from, t.to, t.tickets].every(Number.isInteger)) return "순위·장수는 정수만 입력할 수 있어요.";
    if (t.from < 1 || t.to < t.from) return "시작 순위는 1 이상, 끝 순위는 시작 순위 이상이어야 해요.";
    if (t.tickets < 0) return "장수는 0 이상이어야 해요.";
  }
  const s = [...tiers].sort((a, b) => a.from - b.from);
  for (let i = 1; i < s.length; i++) if (s[i].from <= s[i - 1].to) return "순위 구간이 서로 겹쳐요.";
  return null;
}

const int = (v: string) => Math.floor(Number(v) || 0);
const NUM_INPUT = `${INPUT} w-24 text-right tabular-nums`;

// 소제목 + 변경 뱃지 + 기본값 되돌리기
function SubHead({ label, overridden, onReset }: { label: string; overridden: boolean; onReset: () => void }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <h3 className="text-[14px] font-bold text-fg">{label}</h3>
      {overridden && (
        <>
          <span className="rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-bold text-gold">변경</span>
          <button type="button" onClick={onReset} title="기본값으로 되돌리기" className="text-subtle transition-colors hover:text-fg">
            <RotateCcw className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}

export default function AdminRewards({
  value,
  onChange,
}: {
  value: RewardsOverlay | undefined;
  onChange: (v: RewardsOverlay | undefined) => void;
}) {
  const defaults = GAME_CONFIG.rewards;
  const top = value?.weeklyTop ?? defaults.weeklyTop;
  const wt = value?.weeklyTickets ?? defaults.weeklyTickets;

  const patch = (p: Partial<RewardsOverlay>, removeKey?: keyof RewardsOverlay) => {
    const next: RewardsOverlay = { ...value, ...p };
    if (removeKey) delete next[removeKey];
    onChange(Object.keys(next).length === 0 ? undefined : next);
  };

  const setTop = (rows: number[]) => patch({ weeklyTop: rows });
  const setTiers = (tiers: TicketTier[]) => patch({ weeklyTickets: { ...wt, tiers } });

  // 앞 순위보다 큰 CP는 경고(차단 아님 — 의도적 역전 허용)
  const topWarn = top.some((v, i) => i > 0 && v > top[i - 1]);
  const tierErr = tiersError(wt.tiers);

  return (
    <Card title="주간 랭킹 보상">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* CP 보상표 — 배열 길이 = 지급 순위 컷 */}
        <div>
          <SubHead label="CP 보상표 (순위별 자동 지급)" overridden={value?.weeklyTop !== undefined} onReset={() => patch({}, "weeklyTop")} />
          <div className="flex flex-col gap-1.5">
            {top.map((cp, i) => (
              <div key={i} className="flex items-center gap-2 text-[13.5px] text-muted">
                <span className="w-14 shrink-0 text-right tabular-nums">{i + 1}위</span>
                <input
                  value={String(cp)}
                  onChange={(e) => setTop(top.map((v, j) => (j === i ? Math.max(0, int(e.target.value)) : v)))}
                  inputMode="numeric"
                  className={NUM_INPUT}
                />
                <span className="shrink-0">CP</span>
                <button
                  type="button"
                  onClick={() => setTop(top.filter((_, j) => j !== i))}
                  title="행 삭제"
                  className="shrink-0 text-subtle transition-colors hover:text-danger"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={top.length >= MAX_TOP_ROWS}
            onClick={() => setTop([...top, top[top.length - 1] ?? 0])}
            className={`${BTN_GHOST} mt-2 inline-flex items-center gap-1`}
          >
            <Plus className="h-4 w-4" /> {top.length + 1}위 추가
          </button>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
            행 수 = 지급 순위 컷 (현재 {top.length}위까지). 최대 {MAX_TOP_ROWS}행.
            {topWarn && <span className="ml-1 font-bold text-gold">앞 순위보다 큰 CP가 있어요 — 의도한 설정인지 확인해 주세요.</span>}
          </p>
        </div>

        {/* 가챠 이용권 지급표 — 구간 + 그 외 전원 */}
        <div>
          <SubHead
            label="드로우 티켓 지급표"
            overridden={value?.weeklyTickets !== undefined}
            onReset={() => patch({}, "weeklyTickets")}
          />
          <div className="flex flex-col gap-1.5">
            {wt.tiers.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-[13.5px] text-muted">
                <input
                  value={String(t.from)}
                  onChange={(e) => setTiers(wt.tiers.map((v, j) => (j === i ? { ...v, from: Math.max(0, int(e.target.value)) } : v)))}
                  inputMode="numeric"
                  className={`${INPUT} w-16 text-right tabular-nums`}
                />
                <span className="shrink-0">~</span>
                <input
                  value={String(t.to)}
                  onChange={(e) => setTiers(wt.tiers.map((v, j) => (j === i ? { ...v, to: Math.max(0, int(e.target.value)) } : v)))}
                  inputMode="numeric"
                  className={`${INPUT} w-16 text-right tabular-nums`}
                />
                <span className="shrink-0">위 →</span>
                <input
                  value={String(t.tickets)}
                  onChange={(e) => setTiers(wt.tiers.map((v, j) => (j === i ? { ...v, tickets: Math.max(0, int(e.target.value)) } : v)))}
                  inputMode="numeric"
                  className={`${INPUT} w-16 text-right tabular-nums`}
                />
                <span className="shrink-0">장</span>
                <button
                  type="button"
                  onClick={() => setTiers(wt.tiers.filter((_, j) => j !== i))}
                  title="구간 삭제"
                  className="shrink-0 text-subtle transition-colors hover:text-danger"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2 text-[13.5px] text-muted">
              <span className="shrink-0">그 외 기록 보유자 전원 →</span>
              <input
                value={String(wt.others)}
                onChange={(e) => patch({ weeklyTickets: { ...wt, others: Math.max(0, int(e.target.value)) } })}
                inputMode="numeric"
                className={`${INPUT} w-16 text-right tabular-nums`}
              />
              <span className="shrink-0">장 (0 = 미지급)</span>
            </div>
          </div>
          <button
            type="button"
            disabled={wt.tiers.length >= MAX_TIER_ROWS}
            onClick={() => {
              const last = wt.tiers[wt.tiers.length - 1];
              const from = last ? last.to + 1 : 1;
              setTiers([...wt.tiers, { from, to: from, tickets: 1 }]);
            }}
            className={`${BTN_GHOST} mt-2 inline-flex items-center gap-1`}
          >
            <Plus className="h-4 w-4" /> 구간 추가
          </button>
          {tierErr && <p className="mt-2 text-[12.5px] font-bold text-danger">{tierErr} 저장할 수 없어요.</p>}
        </div>
      </div>

      {/* 유상 이용권 가격 */}
      <div className="mt-6">
        <SubHead label="드로우 티켓 가격 (상점 판매가)" overridden={value?.ticketPrice !== undefined} onReset={() => patch({}, "ticketPrice")} />
        <label className="flex items-center gap-2 text-[13.5px] text-muted">
          <span className="shrink-0">티켓 1장</span>
          <input
            value={value?.ticketPrice !== undefined ? String(value.ticketPrice) : ""}
            onChange={(e) => (e.target.value === "" ? patch({}, "ticketPrice") : patch({ ticketPrice: Math.max(1, int(e.target.value)) }))}
            placeholder={`기본값 ${defaults.ticketPrice}`}
            inputMode="numeric"
            className={NUM_INPUT}
          />
          <span className="shrink-0">CP</span>
        </label>
      </div>

      <p className="mt-4 rounded-[10px] bg-gold/10 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-gold">
        ⚠️ 이 표는 유저가 <b>수령하는 시점</b>에 적용돼요. 주 종료 후 변경하면 아직 수령하지 않은 유저에게 변경값이 적용되니, 지난주 보상
        조건을 바꾸려는 게 아니라면 주 시작 전에 변경해 주세요. CP·티켓 모두 두 모드(일반/아이템)에 각각 지급돼요.
      </p>
    </Card>
  );
}
