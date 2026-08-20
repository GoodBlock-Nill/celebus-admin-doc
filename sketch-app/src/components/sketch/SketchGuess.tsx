"use client";

// CELEB 스케치 — 맞히기 화면 (W2): 리플레이 + 글자 타일 + 서버 판정 + 힌트(CP 소비)·신고·상호 보상 CP.
// 정답 연출(리빌 오버레이 + 획수·시간 메타 배지)은 디자인 리뷰 Critical "보는 재미" 반영.
import { useEffect, useState } from "react";
import { Flag, Lightbulb, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import {
  claimSketchDailyBonus,
  fetchSketchAssignment,
  fetchSketchDaily,
  fetchSketchHint,
  reportSketch,
  submitSketchGuess,
  type SketchAssignment,
} from "@/lib/sketch-api";
import { sfxCoin, sfxNewBest } from "@/lib/sfx";
import { useLang } from "../LangProvider";
import SketchReplay from "./SketchReplay";

const HINT_COST = 10;

type Result = { correct: boolean; word: string | null; cp: number } | null;

// mode "pool" = 일반 풀 배정 / "daily" = 오늘의 데일리 퀴즈 5문제 (전원 동일, 완주 보너스)
export default function SketchGuess({ onDrawInstead, mode = "pool" }: { onDrawInstead: () => void; mode?: "pool" | "daily" }) {
  const { t, lang } = useLang();
  const [assignment, setAssignment] = useState<SketchAssignment | "empty" | "loading" | "error" | "daily-done">("loading");
  const [daily, setDaily] = useState<{ total: number; done: number; correct: number } | null>(null);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [usedTiles, setUsedTiles] = useState<Set<number>>(new Set());
  const [triesLeft, setTriesLeft] = useState(3);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const [busy, setBusy] = useState(false);
  const [bombed, setBombed] = useState<Set<number>>(new Set()); // 힌트로 제거된 더미 타일
  const [reporting, setReporting] = useState(false); // 신고 사유 선택 시트
  const [reported, setReported] = useState(false);

  const present = (a: SketchAssignment) => {
    setAssignment(a);
    setSlots(Array(a.answer_len).fill(null));
    setUsedTiles(new Set());
    setTriesLeft(a.tries_left);
    setBombed(new Set());
    setReporting(false);
    setReported(false);
  };

  const load = async () => {
    setAssignment("loading");
    setResult(null);
    if (mode === "daily") {
      const d = await fetchSketchDaily(lang);
      if (!d) return setAssignment("error");
      const quiz = d.items.filter((i) => !i.mine); // 내 그림은 퀴즈·완주 요건에서 제외
      const doneCount = quiz.filter((i) => i.done).length;
      setDaily({ total: quiz.length, done: doneCount, correct: quiz.filter((i) => i.correct).length });
      const next = quiz.find((i) => !i.done);
      if (!next) {
        // 완주 — 보너스 자동 수령 (이미 받았으면 무시)
        if (!d.bonus_claimed && quiz.length > 0) {
          const b = await claimSketchDailyBonus();
          if (b?.ok) toast.success(t("sk_bonus").replace("{n}", String(b.cp)));
        }
        return setAssignment(quiz.length === 0 ? "empty" : "daily-done");
      }
      return present({ drawing: next.drawing, answer_len: next.answer_len, tiles: next.tiles ?? [], tries_left: next.tries_left });
    }
    const a = await fetchSketchAssignment(lang);
    if (a === "empty") return setAssignment("empty");
    if (!a) return setAssignment("error");
    present(a);
  };
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, lang]);

  if (assignment === "loading") return <div className="mt-4 aspect-square w-full animate-pulse rounded-[16px] bg-surface-1" />;
  if (assignment === "daily-done")
    return (
      <div className="mt-10 flex flex-col items-center gap-3 text-center">
        <Sparkles className="h-8 w-8 text-gold" />
        <p className="text-[16px] font-black text-fg">{t("sk_daily_done_title")}</p>
        {daily && (
          <p className="text-[13px] text-muted">{t("sk_daily_done_sub").replace("{t}", String(daily.total)).replace("{c}", String(daily.correct))}</p>
        )}
        <button onClick={onDrawInstead} className="sk-btn mt-2 px-8 py-3.5 text-[15px]">
          {t("sk_go_draw")}
        </button>
      </div>
    );
  if (assignment === "empty")
    return (
      <div className="mt-10 flex flex-col items-center gap-4 text-center">
        <p className="text-[14px] leading-relaxed text-muted break-keep">{t("sk_empty")}</p>
        <button onClick={onDrawInstead} className="sk-btn px-8 py-3.5 text-[15px]">
          {t("sk_go_draw")}
        </button>
      </div>
    );
  if (assignment === "error")
    return (
      <div className="mt-10 flex flex-col items-center gap-4">
        <p className="text-[13px] text-muted">{t("load_failed")}</p>
        <button onClick={() => void load()} className="sk-btn-ghost px-6 py-3 text-[13.5px]">
          {t("retry_btn")}
        </button>
      </div>
    );

  const a = assignment;
  const filled = slots.every((s) => s !== null);

  const placeTile = (tileIdx: number) => {
    if (usedTiles.has(tileIdx) || result) return;
    const slotIdx = slots.findIndex((s) => s === null);
    if (slotIdx < 0) return;
    setSlots((s) => s.map((v, i) => (i === slotIdx ? a.tiles[tileIdx] : v)));
    setUsedTiles((u) => new Set(u).add(tileIdx));
  };
  const removeSlot = (slotIdx: number) => {
    const ch = slots[slotIdx];
    if (ch == null || result) return;
    // 해당 글자를 놓은 타일 하나를 되돌린다 (같은 글자가 여러 타일일 수 있어 사용 중인 것 중 하나 해제)
    const tileIdx = [...usedTiles].find((ti) => a.tiles[ti] === ch);
    setSlots((s) => s.map((v, i) => (i === slotIdx ? null : v)));
    if (tileIdx != null)
      setUsedTiles((u) => {
        const next = new Set(u);
        next.delete(tileIdx);
        return next;
      });
  };

  const submit = async () => {
    if (!filled || busy || result) return;
    setBusy(true);
    const res = await submitSketchGuess(a.drawing.id, slots.join(""), lang);
    setBusy(false);
    if (!res) return;
    if (res.correct) {
      sfxNewBest();
      setResult({ correct: true, word: res.word ?? slots.join(""), cp: res.cp_awarded ?? 0 });
    } else if (res.done) {
      setResult({ correct: false, word: res.word ?? null, cp: 0 });
    } else {
      sfxCoin();
      setTriesLeft(res.tries_left ?? triesLeft - 1);
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 600);
      setSlots(Array(a.answer_len).fill(null));
      setUsedTiles(new Set());
    }
  };

  const strokeCount = a.drawing.strokes.length;
  const drawSecs = Math.max(1, Math.round(a.drawing.duration_ms / 1000));

  return (
    <div className="flex flex-col gap-3">
      {mode === "daily" && daily && (
        <div className="flex items-center justify-center gap-1.5">
          <span className="rounded-full bg-gold/15 px-2.5 py-1 text-[11.5px] font-black text-gold">{t("sk_daily_card")}</span>
          <span className="text-[12px] font-bold tabular-nums text-muted">{daily.done + 1}/{daily.total}</span>
        </div>
      )}
      <div className="relative">
        <SketchReplay strokes={a.drawing.strokes} />
        {/* 정답/종료 리빌 오버레이 — 완성 리빌 + 메타 배지 (보는 재미 연출) */}
        {result && (
          <div className="anim-pop-in absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[16px] bg-black/60 backdrop-blur-[2px]">
            {result.correct ? (
              <>
                <Sparkles className="h-8 w-8 text-gold" />
                <div className="text-[24px] font-black text-white">{t("sk_correct")}</div>
              </>
            ) : (
              <div className="text-[18px] font-black text-white/85">{t("sk_wrong_end")}</div>
            )}
            {result.word && (
              <div className="rounded-full bg-primary px-5 py-2 text-[18px] font-black text-white">{result.word}</div>
            )}
            {result.cp > 0 && <div className="text-[14px] font-black text-gold">{t("sk_cp_award").replace("{n}", String(result.cp))}</div>}
            <div className="rounded-full bg-black/50 px-3.5 py-1.5 text-[12px] font-bold text-white/80 ring-1 ring-white/20">
              {t("sk_meta").replace("{s}", String(strokeCount)).replace("{t}", String(drawSecs))}
            </div>
          </div>
        )}
      </div>

      {!result ? (
        <>
          {/* 정답 슬롯 */}
          <div className={`flex flex-wrap items-center justify-center gap-1.5 ${wrongFlash ? "gacha-shake" : ""}`}>
            {slots.map((s, i) => (
              <button
                key={i}
                onClick={() => removeSlot(i)}
                className={`sk-slot ${slots.length > 7 ? "h-10 w-9 text-[15px]" : "h-12 w-12 text-[19px]"} ${
                  a.tile_lang === "en" ? "uppercase" : ""
                } ${s != null ? "sk-slot-filled" : ""} ${wrongFlash ? "sk-slot-wrong" : ""}`}
              >
                {s ?? ""}
              </button>
            ))}
            <span className="ml-2 text-[12px] font-bold tabular-nums text-subtle">{t("sk_tries").replace("{n}", String(triesLeft))}</span>
          </div>

          {/* 글자 타일 — 언어별 고정 그리드 (en·ja 6열, ko 5열), en은 대문자 표기 */}
          <div className={`mx-auto grid w-fit gap-2 rounded-[18px] bg-surface-2 p-3 ring-1 ring-hairline ${a.tile_lang === "ko" ? "grid-cols-5" : "grid-cols-6"}`}>
            {a.tiles.map((tile, i) => (
              <button
                key={i}
                onClick={() => placeTile(i)}
                disabled={usedTiles.has(i) || bombed.has(i)}
                className={`sk-tile h-12 w-12 ${a.tile_lang === "en" ? "text-[19px] uppercase" : "text-[18px]"}`}
              >
                {bombed.has(i) ? "💥" : tile}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setSlots(Array(a.answer_len).fill(null));
                setUsedTiles(new Set());
              }}
              disabled={slots.every((s) => s === null)}
              aria-label={t("sk_clear_input")}
              className="sk-btn-ghost flex h-12 w-12 shrink-0 items-center justify-center disabled:opacity-40"
            >
              <X className="h-5 w-5" />
            </button>
            {/* 힌트 — 더미 타일 제거 (Draw Something 폭탄 방식, 10 CP·그림당 1회) */}
            <button
              onClick={async () => {
                if (busy || bombed.size > 0) return;
                const h = await fetchSketchHint(a.drawing.id, lang, a.tiles);
                if (h?.remove?.length) {
                  setBombed(new Set(h.remove));
                  if ((h.charged ?? 0) > 0) toast.success(t("sk_hint_used").replace("{n}", String(h.charged)));
                  toast.success(t("sk_hint_removed").replace("{n}", String(h.remove.length)));
                } else toast.error(h?.error === "insufficient" ? t("sk_no_cp") : t("sk_hint_fail"));
              }}
              disabled={busy || bombed.size > 0}
              className="sk-btn-ghost flex h-12 shrink-0 items-center gap-1 px-3.5 text-[12.5px] !text-gold disabled:opacity-60"
            >
              <Lightbulb className="h-4 w-4" />
              {t("sk_hint_btn").replace("{n}", String(HINT_COST))}
            </button>
            <button
              onClick={() => void submit()}
              disabled={!filled || busy}
              className="sk-btn min-w-0 flex-1 py-3.5 text-[15px]"
            >
              {t("confirm")}
            </button>
          </div>

          {/* 신고 — 부적절/글자 반칙 (§6). 임계 도달 시 서버가 자동 비공개 */}
          <div className="flex justify-center">
            {reported ? (
              <span className="text-[11.5px] font-bold text-subtle">{t("sk_reported")}</span>
            ) : reporting ? (
              <div className="flex items-center gap-1.5">
                {([["inappropriate", t("sk_report_bad")], ["letters", t("sk_report_letters")]] as const).map(([reason, label]) => (
                  <button
                    key={reason}
                    onClick={async () => {
                      const ok = await reportSketch(a.drawing.id, reason);
                      setReporting(false);
                      if (ok) setReported(true);
                      else toast.error(t("sk_report_fail"));
                    }}
                    className="rounded-full bg-surface-1 px-3 py-1.5 text-[11.5px] font-bold text-fg ring-1 ring-hairline"
                  >
                    {label}
                  </button>
                ))}
                <button onClick={() => setReporting(false)} className="px-2 text-[11.5px] font-bold text-subtle">
                  {t("sk_cancel")}
                </button>
              </div>
            ) : (
              <button onClick={() => setReporting(true)} className="flex items-center gap-1 px-2 py-1 text-[11.5px] font-bold text-subtle">
                <Flag className="h-3 w-3" /> {t("sk_report")}
              </button>
            )}
          </div>
        </>
      ) : (
        <button onClick={() => void load()} className="sk-btn w-full py-3.5 text-[15px]">
          {mode === "daily" ? t("sk_next_q") : t("sk_next")}
        </button>
      )}
    </div>
  );
}
