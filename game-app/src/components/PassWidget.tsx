"use client";

// CELEB PASS 위젯 (홈) — 시즌 누적 트랙. 성과 무관 XP가 매판 쌓여 "진 판에도 진행"을 보장(피로감 개선 Wave A).
// 미션 위젯과 동일한 접이식 패턴 — 받을 보상 있으면 자동 펼침 + 골드 [받기].
import { useEffect, useState } from "react";
import { ChevronDown, Star } from "lucide-react";
import { toast } from "sonner";
import { sfxCoin } from "@/lib/sfx";
import { GAME_CONFIG } from "@/lib/game-config";
import { fetchPassStatus, claimPass, type PassStatus } from "@/lib/game-api";
import { useLang } from "./LangProvider";

const levelOf = (xp: number) => Math.min(Math.floor(xp / Math.max(GAME_CONFIG.pass.perLevel, 1)), GAME_CONFIG.pass.maxLevel);

export default function PassWidget({ onReward }: { onReward: (celebPoint: number) => void }) {
  const { t } = useLang();
  const [st, setSt] = useState<PassStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const claimableOf = (xp: number, claimed: number[]) => levelOf(xp) - claimed.length;

  const load = async (autoOpen = false) => {
    const data = await fetchPassStatus();
    if (!data) return;
    setSt(data);
    const c = claimableOf(data.xp, data.claimed) + (data.prev ? claimableOf(data.prev.xp, data.prev.claimed) : 0);
    if (autoOpen && c > 0) setOpen(true);
  };
  useEffect(() => {
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!st) return null;

  const { perLevel, maxLevel, milestones, defaultCp } = GAME_CONFIG.pass;
  const lv = levelOf(st.xp);
  const inLevel = lv >= maxLevel ? perLevel : st.xp % perLevel;
  const pct = lv >= maxLevel ? 100 : Math.round((inLevel / perLevel) * 100);
  const claimable = claimableOf(st.xp, st.claimed);
  const prevClaimable = st.prev ? claimableOf(st.prev.xp, st.prev.claimed) : 0;
  const nextMilestone = milestones.find((m) => m.level > lv);

  const claim = async (season: string) => {
    if (busy) return;
    setBusy(true);
    const r = await claimPass(season);
    if (r) {
      sfxCoin();
      const heartsMsg = r.hearts > 0 ? " · " + t("pass_hearts").replace("{n}", String(r.hearts)) : "";
      toast.success(t("pass_got").replace("{n}", String(r.cp)) + heartsMsg);
      onReward(r.balance);
    }
    await load();
    setBusy(false);
  };

  return (
    <div className="mx-4 rounded-[16px] bg-black/45 ring-1 ring-white/15 backdrop-blur">
      {/* 요약 줄 — 탭으로 펼침/접힘 */}
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left">
        <Star className="h-4 w-4 shrink-0 text-gold" />
        <span className="text-[12px] font-black text-white">{t("pass_title")}</span>
        <span className="shrink-0 rounded-full bg-white/12 px-1.5 py-0.5 text-[10px] font-black tabular-nums text-white/80">Lv.{lv}</span>
        {/* 미니 진행바 */}
        <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
          <span className="block h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
        </span>
        {claimable + prevClaimable > 0 ? (
          <span className="shrink-0 rounded-full bg-gold px-2 py-0.5 text-[10px] font-black text-black">
            {t("mission_claim")} {claimable + prevClaimable}
          </span>
        ) : (
          <span className="shrink-0 text-[10px] font-bold tabular-nums text-white/40">
            {lv >= maxLevel ? "MAX" : `${inLevel}/${perLevel}`}
          </span>
        )}
        <ChevronDown className={`h-4 w-4 shrink-0 text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* 펼침 — 진행 상세 + 수령 */}
      {open && (
        <div className="flex flex-col gap-2 px-3.5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between">
                <span className="text-[11.5px] font-bold text-white/85">{t("pass_note")}</span>
                <span className="text-[10px] tabular-nums text-white/45">
                  {lv >= maxLevel ? "MAX" : t("pass_next_in").replace("{n}", String(perLevel - inLevel))}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
              </div>
              {nextMilestone && (
                <div className="mt-1 text-[10px] font-bold text-white/40">
                  {t("pass_milestone")
                    .replace("{lv}", String(nextMilestone.level))
                    .replace("{cp}", String(nextMilestone.cp ?? defaultCp))}
                  {(nextMilestone.hearts ?? 0) > 0 && " · " + t("pass_hearts").replace("{n}", String(nextMilestone.hearts))}
                </div>
              )}
            </div>
            {claimable > 0 && (
              <button
                disabled={busy}
                onClick={() => void claim(st.season)}
                className="w-[64px] shrink-0 rounded-full bg-gold py-1.5 text-[11px] font-black text-black active:scale-95 disabled:opacity-50"
              >
                {t("mission_claim")} {claimable}
              </button>
            )}
          </div>

          {/* 지난 시즌 유예 수령 (월초 7일) */}
          {st.prev && prevClaimable > 0 && (
            <div className="flex items-center gap-2.5 rounded-[10px] bg-gold/15 px-2.5 py-2 ring-1 ring-gold/30">
              <span className="min-w-0 flex-1 text-[11px] font-bold text-white/85">
                {t("pass_prev").replace("{s}", st.prev.season)}
              </span>
              <button
                disabled={busy}
                onClick={() => void claim(st.prev!.season)}
                className="shrink-0 rounded-full bg-gold px-3 py-1.5 text-[11px] font-black text-black active:scale-95 disabled:opacity-50"
              >
                {t("mission_claim")} {prevClaimable}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
