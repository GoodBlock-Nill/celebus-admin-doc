"use client";

// CELEB 스케치 — W1 수직 슬라이스 하네스 (비공개 라우트, 내비 미연결).
// 그리기(서버 제시어 3택 1 → 제출)와 맞히기(배정 → 리플레이 → 글자 타일 → 서버 판정) 두 루프의 E2E.
// 게이트: 그리기·맞히기 상호 보상 루프 체감 (기획 §11 W1). CP 보상·검수 큐·신고는 W2.
import { useEffect, useState } from "react";
import { CalendarCheck, ChevronLeft, Crown, Palette, Search } from "lucide-react";
import { toast } from "sonner";
import SketchCanvas from "@/components/sketch/SketchCanvas";
import SketchGuess from "@/components/sketch/SketchGuess";
import SketchReplay from "@/components/sketch/SketchReplay";
import { loadDrawings, saveDrawing, type SketchStroke } from "@/lib/sketch";
import { fetchSketchBest, fetchSketchWords, submitSketch, type SketchBest, type SketchWordChoice } from "@/lib/sketch-api";

type Phase =
  | { name: "home" }
  | { name: "pick"; words: SketchWordChoice[] }
  | { name: "draw"; word: SketchWordChoice }
  | { name: "submitted"; word: SketchWordChoice; strokes: SketchStroke[] }
  | { name: "guess"; mode: "pool" | "daily" };

export default function SketchPage() {
  const [phase, setPhase] = useState<Phase>({ name: "home" });
  const [savedCount, setSavedCount] = useState(0);
  const [best, setBest] = useState<SketchBest | null>(null);
  const [showBestReplay, setShowBestReplay] = useState(false);
  useEffect(() => setSavedCount(loadDrawings().length), [phase.name]);
  useEffect(() => {
    if (phase.name === "home") void fetchSketchBest().then(setBest);
  }, [phase.name]);

  const startDraw = async () => {
    const words = await fetchSketchWords();
    if (words.length === 0) return toast.error("제시어를 불러오지 못했어요.");
    setPhase({ name: "pick", words });
  };

  const submit = (word: SketchWordChoice) => async (strokes: SketchStroke[], durationMs: number) => {
    saveDrawing({ word: word.text, strokes, durationMs, createdAt: new Date().toISOString() });
    const moderation = await submitSketch(word.id, strokes, durationMs);
    if (!moderation) toast.error("서버 제출에 실패했어요 — 그림은 기기에 보관돼 있어요.");
    else if (moderation === "approve") toast.success("제출 완료! 다른 팬들이 맞히기 시작해요.");
    else if (moderation === "hold") toast.success("제출 완료! 확인 후 공개돼요.");
    else if (moderation === "processing") toast.success("제출 완료! 검토가 끝나면 자동으로 공개돼요.");
    else toast.error("커뮤니티 규칙에 맞지 않는 그림으로 판단되어 공개되지 않았어요. 오판이라고 생각되면 문의해 주세요 — 다시 확인해드려요.");
    setPhase({ name: "submitted", word, strokes });
  };

  const back = () => setPhase({ name: "home" });

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col gap-4 px-5 pb-8 pt-6 px-safe pb-safe pt-safe">
      <div className="flex items-center gap-1">
        {phase.name !== "home" && (
          <button onClick={back} aria-label="뒤로" className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-muted">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-[19px] font-black text-fg">CELEB 스케치</h1>
        <span className="ml-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-black text-gold">W1 베타</span>
      </div>

      {phase.name === "home" && (
        <div className="flex flex-col gap-3">
          {/* 데일리 그림 퀴즈 — 전원 동일 5문제, 완주 보너스 */}
          <button
            onClick={() => setPhase({ name: "guess", mode: "daily" })}
            className="flex items-center gap-3.5 rounded-[18px] bg-gradient-to-r from-gold/20 to-surface-1 p-4 ring-1 ring-gold/40 active:scale-[0.99]"
          >
            <CalendarCheck className="h-8 w-8 shrink-0 text-gold" />
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-[16px] font-black text-fg">데일리 퀴즈</span>
              <span className="mt-0.5 block text-[12px] text-muted break-keep">매일 뽑힌 베스트 그림 5문제 — 완주하면 보너스 CP</span>
            </span>
          </button>
          <button
            onClick={() => void startDraw()}
            className="flex items-center gap-3.5 rounded-[18px] bg-gradient-to-r from-primary/25 to-surface-1 p-4 ring-1 ring-primary/30 active:scale-[0.99]"
          >
            <Palette className="h-8 w-8 shrink-0 text-primary-400" />
            <span className="text-left">
              <span className="block text-[16px] font-black text-fg">그리기</span>
              <span className="mt-0.5 block text-[12px] text-muted break-keep">제시어를 골라 60초 안에 그려서 올려요 — 데일리 퀴즈에 뽑히면 보상!</span>
            </span>
          </button>
          <button
            onClick={() => setPhase({ name: "guess", mode: "pool" })}
            className="flex items-center gap-3.5 rounded-[18px] bg-surface-1 p-4 ring-1 ring-hairline active:scale-[0.99]"
          >
            <Search className="h-8 w-8 shrink-0 text-primary-400" />
            <span className="text-left">
              <span className="block text-[16px] font-black text-fg">맞히기</span>
              <span className="mt-0.5 block text-[12px] text-muted break-keep">그려지는 과정을 보고 글자 타일로 정답을 맞혀요</span>
            </span>
          </button>

          {/* 명예의 전당 — 지난주 베스트 스케치 (작가 보상 = 드로우 티켓) */}
          {best && (
            <div className="rounded-[18px] bg-surface-1 p-4 ring-1 ring-hairline">
              <button onClick={() => setShowBestReplay((v) => !v)} className="flex w-full items-center gap-3.5 active:scale-[0.99]">
                {best.thumb_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={best.thumb_url} alt="" className="h-12 w-12 shrink-0 rounded-[10px] object-cover ring-1 ring-gold/50" />
                ) : (
                  <Crown className="h-8 w-8 shrink-0 text-gold" />
                )}
                <span className="min-w-0 flex-1 text-left">
                  <span className="flex items-center gap-1.5 text-[14px] font-black text-fg">
                    <Crown className="h-4 w-4 text-gold" /> 이번 주 베스트 스케치
                  </span>
                  <span className="mt-0.5 block text-[12px] text-muted break-keep">
                    제시어 <b className="text-gold">{best.word}</b> · {best.correct_count.toLocaleString()}명이 맞혔어요
                  </span>
                </span>
                <span className="shrink-0 text-[11.5px] font-bold text-subtle">{showBestReplay ? "접기" : "리플레이"}</span>
              </button>
              {showBestReplay && (
                <div className="mt-3">
                  <SketchReplay strokes={best.strokes} />
                </div>
              )}
            </div>
          )}
          {savedCount > 0 && <p className="text-center text-[11.5px] text-subtle">이 기기에서 그린 그림 {savedCount}장</p>}
        </div>
      )}

      {phase.name === "pick" && (
        <div className="flex flex-col gap-3">
          <p className="text-[13.5px] leading-relaxed text-muted break-keep">제시어를 하나 골라 60초 안에 그려보세요.</p>
          {phase.words.map((w) => (
            <button
              key={w.id}
              onClick={() => setPhase({ name: "draw", word: w })}
              className="flex items-center justify-between rounded-[16px] bg-surface-1 px-5 py-4 ring-1 ring-hairline active:scale-[0.99]"
            >
              <span className="text-[16px] font-black text-fg">{w.text}</span>
              <span className="text-[12px] font-bold text-gold">{"★".repeat(w.difficulty)}</span>
            </button>
          ))}
          <button onClick={() => void startDraw()} className="text-[12.5px] font-bold text-subtle">
            다른 제시어 보기
          </button>
        </div>
      )}

      {phase.name === "draw" && <SketchCanvas word={phase.word.text} onSubmit={submit(phase.word)} />}

      {phase.name === "submitted" && (
        <div className="flex flex-col gap-3">
          <p className="text-center text-[14px] font-black text-fg break-keep">
            <span className="text-primary-400">{phase.word.text}</span> 제출 완료! 그린 과정을 다시 볼까요?
          </p>
          <SketchReplay strokes={phase.strokes} />
          <div className="flex gap-2">
            <button onClick={() => void startDraw()} className="flex-1 rounded-full bg-surface-1 py-3.5 text-[14px] font-bold text-fg ring-1 ring-hairline active:scale-[0.99]">
              한 장 더 그리기
            </button>
            <button onClick={() => setPhase({ name: "guess", mode: "pool" })} className="flex-1 rounded-full bg-primary py-3.5 text-[14px] font-black text-white active:scale-[0.99]">
              맞히러 가기
            </button>
          </div>
        </div>
      )}

      {phase.name === "guess" && <SketchGuess mode={phase.mode} onDrawInstead={() => void startDraw()} />}
    </div>
  );
}
