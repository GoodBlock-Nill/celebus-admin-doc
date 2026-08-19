"use client";

// CELEB 스케치 — 맞히기 화면 (W2): 리플레이 + 글자 타일 + 서버 판정 + 힌트(CP 소비)·신고·상호 보상 CP.
// 정답 연출(리빌 오버레이 + 획수·시간 메타 배지)은 디자인 리뷰 Critical "보는 재미" 반영.
import { useEffect, useState } from "react";
import { Flag, Lightbulb, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { fetchSketchAssignment, fetchSketchHint, reportSketch, submitSketchGuess, type SketchAssignment } from "@/lib/sketch-api";
import { sfxCoin, sfxNewBest } from "@/lib/sfx";
import SketchReplay from "./SketchReplay";

const HINT_COST = 10;

type Result = { correct: boolean; word: string | null; cp: number } | null;

export default function SketchGuess({ onDrawInstead }: { onDrawInstead: () => void }) {
  const [assignment, setAssignment] = useState<SketchAssignment | "empty" | "loading" | "error">("loading");
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [usedTiles, setUsedTiles] = useState<Set<number>>(new Set());
  const [triesLeft, setTriesLeft] = useState(3);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const [busy, setBusy] = useState(false);
  const [hintChar, setHintChar] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false); // 신고 사유 선택 시트
  const [reported, setReported] = useState(false);

  const load = async () => {
    setAssignment("loading");
    setResult(null);
    const a = await fetchSketchAssignment();
    if (a === "empty") return setAssignment("empty");
    if (!a) return setAssignment("error");
    setAssignment(a);
    setSlots(Array(a.answer_len).fill(null));
    setUsedTiles(new Set());
    setTriesLeft(a.tries_left);
    setHintChar(null);
    setReporting(false);
    setReported(false);
  };
  useEffect(() => {
    void load();
  }, []);

  if (assignment === "loading") return <div className="mt-4 aspect-square w-full animate-pulse rounded-[16px] bg-surface-1" />;
  if (assignment === "empty")
    return (
      <div className="mt-10 flex flex-col items-center gap-4 text-center">
        <p className="text-[14px] leading-relaxed text-muted break-keep">
          아직 맞힐 그림이 없어요.
          <br />
          첫 그림의 주인공이 되어보세요!
        </p>
        <button onClick={onDrawInstead} className="rounded-full bg-primary px-8 py-3.5 text-[15px] font-black text-white active:scale-[0.99]">
          그리러 가기
        </button>
      </div>
    );
  if (assignment === "error")
    return (
      <div className="mt-10 flex flex-col items-center gap-4">
        <p className="text-[13px] text-muted">불러오지 못했어요. 다시 시도해주세요.</p>
        <button onClick={() => void load()} className="rounded-full bg-surface-1 px-6 py-3 text-[13.5px] font-bold text-fg ring-1 ring-hairline">
          다시 시도
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
    const res = await submitSketchGuess(a.drawing.id, slots.join(""));
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
      <div className="relative">
        <SketchReplay strokes={a.drawing.strokes} />
        {/* 정답/종료 리빌 오버레이 — 완성 리빌 + 메타 배지 (보는 재미 연출) */}
        {result && (
          <div className="anim-pop-in absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[16px] bg-black/60 backdrop-blur-[2px]">
            {result.correct ? (
              <>
                <Sparkles className="h-8 w-8 text-gold" />
                <div className="text-[24px] font-black text-white">정답!</div>
              </>
            ) : (
              <div className="text-[18px] font-black text-white/85">아쉬워요!</div>
            )}
            {result.word && (
              <div className="rounded-full bg-primary px-5 py-2 text-[18px] font-black text-white">{result.word}</div>
            )}
            {result.cp > 0 && <div className="text-[14px] font-black text-gold">+{result.cp} CP · 그린 사람도 +3 CP</div>}
            <div className="rounded-full bg-black/50 px-3.5 py-1.5 text-[12px] font-bold text-white/80 ring-1 ring-white/20">
              {strokeCount}획 · {drawSecs}초 완성
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
                className={`flex h-12 w-12 items-center justify-center rounded-[12px] text-[19px] font-black ${
                  s != null ? "bg-primary/25 text-fg ring-2 ring-primary-400" : "bg-surface-1 ring-1 ring-hairline"
                } ${wrongFlash ? "ring-danger text-danger" : ""}`}
              >
                {s ?? ""}
              </button>
            ))}
            <span className="ml-2 text-[12px] font-bold tabular-nums text-subtle">시도 {triesLeft}회</span>
          </div>

          {/* 글자 타일 */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {a.tiles.map((t, i) => (
              <button
                key={i}
                onClick={() => placeTile(i)}
                disabled={usedTiles.has(i)}
                className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-surface-2 text-[19px] font-black text-fg ring-1 ring-hairline active:scale-95 disabled:opacity-25"
              >
                {t}
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
              aria-label="입력 지우기"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-1 text-muted ring-1 ring-hairline disabled:opacity-40"
            >
              <X className="h-5 w-5" />
            </button>
            {/* 힌트 — 첫 글자 공개 (10 CP, 그림당 1회) */}
            <button
              onClick={async () => {
                if (busy || hintChar) return;
                const h = await fetchSketchHint(a.drawing.id);
                if (h?.first) {
                  setHintChar(h.first);
                  if ((h.charged ?? 0) > 0) toast.success(`힌트 사용 -${h.charged} CP`);
                } else toast.error(h?.error === "insufficient" ? "CP가 부족해요." : "힌트를 불러오지 못했어요.");
              }}
              disabled={busy || !!hintChar}
              className="flex h-12 shrink-0 items-center gap-1 rounded-full bg-surface-1 px-3.5 text-[12.5px] font-bold text-gold ring-1 ring-hairline disabled:opacity-60"
            >
              <Lightbulb className="h-4 w-4" />
              {hintChar ? `첫 글자 "${hintChar}"` : `힌트 ${HINT_COST}`}
            </button>
            <button
              onClick={() => void submit()}
              disabled={!filled || busy}
              className="min-w-0 flex-1 rounded-full bg-primary py-3.5 text-[15px] font-black text-white active:scale-[0.99] disabled:opacity-40"
            >
              확인
            </button>
          </div>

          {/* 신고 — 부적절/글자 반칙 (§6). 임계 도달 시 서버가 자동 비공개 */}
          <div className="flex justify-center">
            {reported ? (
              <span className="text-[11.5px] font-bold text-subtle">신고가 접수됐어요. 확인 후 조치할게요.</span>
            ) : reporting ? (
              <div className="flex items-center gap-1.5">
                {([["inappropriate", "부적절한 그림"], ["letters", "글자를 썼어요"]] as const).map(([reason, label]) => (
                  <button
                    key={reason}
                    onClick={async () => {
                      const ok = await reportSketch(a.drawing.id, reason);
                      setReporting(false);
                      if (ok) setReported(true);
                      else toast.error("신고에 실패했어요.");
                    }}
                    className="rounded-full bg-surface-1 px-3 py-1.5 text-[11.5px] font-bold text-fg ring-1 ring-hairline"
                  >
                    {label}
                  </button>
                ))}
                <button onClick={() => setReporting(false)} className="px-2 text-[11.5px] font-bold text-subtle">
                  취소
                </button>
              </div>
            ) : (
              <button onClick={() => setReporting(true)} className="flex items-center gap-1 px-2 py-1 text-[11.5px] font-bold text-subtle">
                <Flag className="h-3 w-3" /> 이 그림 신고
              </button>
            )}
          </div>
        </>
      ) : (
        <button onClick={() => void load()} className="w-full rounded-full bg-primary py-3.5 text-[15px] font-black text-white active:scale-[0.99]">
          다음 그림
        </button>
      )}
    </div>
  );
}
