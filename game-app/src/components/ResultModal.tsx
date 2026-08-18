"use client";

// 게임 결과 모달 — 점수 카운트업 재생·도달 레벨·최대 콤보·이전 최고 대비·모드 랭크·new-best 컨페티.
import { useEffect, useRef, useState } from "react";
import { RotateCcw, Home, Trophy, Share2 } from "lucide-react";
import { getAvatar, getNick, topPercent, type RankInfo } from "@/lib/game-api";
import { shareResultCard } from "@/lib/share-card";
import { useCountUp } from "@/lib/use-count-up";
import { useFocusTrap } from "@/lib/use-focus-trap";
import Avatar from "./Avatar";
import { useLang } from "./LangProvider";

// 하위권 상위%는 부정 프레임 → 이 값 이내일 때만 노출, 그 외 전체 인원 표기
const TOP_PERCENT_VISIBLE_MAX = 50;

// new-best 컨페티 (결정적 배치 — 랜덤 미사용)
const CONFETTI_COLORS = ["#f5c451", "#8b5cf6", "#ec4899", "#60a5fa", "#34d399"];
const CONFETTI = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 61) % 100,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: (i % 5) * 0.12,
}));

export default function ResultModal({
  score,
  maxCombo,
  prevBest,
  level,
  breakdown,
  isNewBest,
  rank,
  submitting,
  mode,
  onRetry,
  onViewRanking,
  onExit,
}: {
  score: number;
  maxCombo: number;
  prevBest: number;
  level: number;
  breakdown?: { match: number; chain: number; special: number; fever: number };
  isNewBest: boolean;
  rank: RankInfo | null;
  submitting: boolean;
  mode: "free" | "daily";
  onRetry: () => void;
  onViewRanking?: () => void;
  onExit?: () => void;
}) {
  const { t } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  useFocusTrap(ref, true);
  // 모달 등장 시 0 → 최종 점수 카운트업 재생 (useCountUp은 마운트 값 즉시 표시라 0에서 출발시킴)
  const [countTarget, setCountTarget] = useState(0);
  useEffect(() => {
    setCountTarget(score);
  }, [score]);
  const shown = useCountUp(countTarget, 700);
  const pct = rank && rank.rank != null ? topPercent(rank.rank, rank.total || 0) : null;
  return (
    <div className="anim-backdrop-in fixed inset-0 z-50 flex flex-col items-center overflow-y-auto overscroll-contain bg-black/75 p-4">
      {/* 최고 점수 갱신 컨페티 */}
      {isNewBest &&
        CONFETTI.map((p, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s` }}
          />
        ))}
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={t("result_title")}
        tabIndex={-1}
        className="anim-pop-in my-auto w-full max-w-xs rounded-[22px] bg-surface-2 p-6 text-center outline-none ring-1 ring-hairline"
      >
        <div className="mb-3 flex items-center justify-center gap-2">
          <Avatar value={getAvatar()} size="sm" />
          <span className="max-w-[60%] truncate text-[13px] font-bold text-fg">{getNick() || t("nickname")}</span>
        </div>
        <div className="text-[15px] font-black text-muted">{t("result_title")}</div>
        <div className="my-2 text-[44px] font-black tabular-nums text-primary-400">{shown.toLocaleString()}</div>
        {isNewBest && (
          <div className="mb-2 text-[13px] font-bold text-gold">
            {t("result_new_best")}
            {prevBest > 0 && <span className="ml-1 tabular-nums">+{(score - prevBest).toLocaleString()}</span>}
          </div>
        )}

        {/* 이번 판 통계 — 도달 레벨 · 최대 콤보 · 최고 점수 */}
        <div className="mb-3 grid grid-cols-3 gap-2">
          <div className="rounded-[14px] bg-surface-1 px-2 py-2 ring-1 ring-hairline">
            <div className="text-[10px] font-bold text-subtle">{t("result_level")}</div>
            <div className="text-[15px] font-black text-primary-400">
              {t("lv_prefix")}
              {level}
            </div>
          </div>
          <div className="rounded-[14px] bg-surface-1 px-2 py-2 ring-1 ring-hairline">
            <div className="text-[10px] font-bold text-subtle">{t("result_max_combo")}</div>
            <div className="text-[15px] font-black tabular-nums text-fg">{maxCombo > 0 ? `${maxCombo}x` : "-"}</div>
          </div>
          <div className="rounded-[14px] bg-surface-1 px-2 py-2 ring-1 ring-hairline">
            <div className="text-[10px] font-bold text-subtle">{t("best")}</div>
            <div className="text-[15px] font-black tabular-nums text-fg">{Math.max(prevBest, score).toLocaleString()}</div>
          </div>
        </div>

        {/* 점수 분해 — 출처별(매치/연쇄/스페셜·콤보/피버). 0인 항목은 숨김. 합 = 최종 점수 */}
        {breakdown && breakdown.match + breakdown.chain + breakdown.special + breakdown.fever > 0 && (
          <div className="mb-4 rounded-[14px] bg-surface-1 px-4 py-2.5 ring-1 ring-hairline">
            <div className="mb-1 text-left text-[10px] font-bold text-subtle">{t("result_bd_title")}</div>
            {(
              [
                ["result_bd_match", breakdown.match, "text-fg"],
                ["result_bd_chain", breakdown.chain, "text-primary-400"],
                ["result_bd_special", breakdown.special, "text-primary-400"],
                ["result_bd_fever", breakdown.fever, "text-gold"],
              ] as const
            )
              .filter(([, v]) => v > 0)
              .map(([k, v, cls]) => (
                <div key={k} className="flex items-center justify-between py-0.5 text-[12px]">
                  <span className="font-bold text-muted">{t(k)}</span>
                  <span className={`font-black tabular-nums ${cls}`}>+{v.toLocaleString()}</span>
                </div>
              ))}
          </div>
        )}

        {/* CELEB PASS +XP — 성과 무관 적립(피로감 개선): 진 판에도 "쌓였다"를 매판 보여주는 핵심 장치 */}
        {rank && (rank.pass_xp_gained ?? 0) > 0 && (
          <div className="mb-4 flex items-center justify-between rounded-[14px] bg-gold/15 px-4 py-2.5 ring-1 ring-gold/35">
            <span className="text-[12px] font-black text-gold">★ {t("pass_title")}</span>
            <span className="text-[13px] font-black tabular-nums text-gold">+{rank.pass_xp_gained} XP</span>
          </div>
        )}

        {/* 모드 랭크 (서버 응답) — 상위 50% 이내만 상위% 노출, 그 외 전체 인원 표기 */}
        {(submitting || (rank && rank.rank != null && (rank.total || 0) > 0)) && (
          <div className="mb-4 rounded-[14px] bg-surface-1 px-4 py-3 ring-1 ring-hairline">
            <div className="text-[10px] font-bold text-subtle">{t(mode === "free" ? "lb_item" : "lb_normal")}</div>
            {submitting || !rank || rank.rank == null ? (
              <div className="mx-auto mt-1 h-5 w-24 animate-pulse rounded bg-surface-2" />
            ) : (
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-[22px] font-black tabular-nums text-primary-400">
                  {rank.rank.toLocaleString()}
                  <span className="text-[12px] font-bold text-muted">{t("rank_unit")}</span>
                </span>
                {pct != null && pct <= TOP_PERCENT_VISIBLE_MAX ? (
                  <span className="text-[11px] font-bold text-gold">{t("top_percent").replace("{p}", String(pct))}</span>
                ) : (
                  <span className="text-[11px] font-bold text-muted">
                    {t("rank_total").replace("{n}", (rank.total || 0).toLocaleString())}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-[15px] font-black text-white active:scale-[0.99]"
          >
            <RotateCcw className="h-4 w-4" /> {t("retry")}
          </button>
          <button
            disabled={sharing}
            onClick={async () => {
              setSharing(true);
              await shareResultCard({
                score,
                level,
                nickname: getNick() || t("nickname"),
                modeLabel: t(mode === "free" ? "lb_item" : "lb_normal"),
                newBest: isNewBest,
              });
              setSharing(false);
            }}
            className="flex items-center justify-center gap-2 rounded-full bg-surface-1 py-3 text-[14px] font-bold text-fg ring-1 ring-hairline active:scale-[0.99] disabled:opacity-50"
          >
            <Share2 className="h-4 w-4 text-primary-400" /> {sharing ? "…" : t("result_share")}
          </button>
          {onViewRanking && (
            <button
              onClick={onViewRanking}
              className="flex items-center justify-center gap-2 rounded-full bg-surface-1 py-3 text-[14px] font-bold text-fg ring-1 ring-hairline active:scale-[0.99]"
            >
              <Trophy className="h-4 w-4 text-gold" /> {t("view_ranking")}
            </button>
          )}
          {onExit && (
            <button
              onClick={onExit}
              className="flex items-center justify-center gap-2 rounded-full bg-surface-1 py-3 text-[14px] font-bold text-muted ring-1 ring-hairline"
            >
              <Home className="h-4 w-4" /> {t("home")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
