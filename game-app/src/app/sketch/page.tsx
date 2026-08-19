"use client";

// CELEB 스케치 — W0 프로토타입 하네스 (비공개 라우트, 내비 미연결).
// 게이트: "손가락으로 그리는 게 즐겁고, 리플레이가 보는 재미가 있는가" (기획 §11 W0).
// 서버 없음 — 그림은 기기 로컬(localStorage)에만 저장. 제시어는 샘플 풀에서 3택 1 (기획 §4.2 축소판).
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import SketchCanvas from "@/components/sketch/SketchCanvas";
import SketchReplay from "@/components/sketch/SketchReplay";
import { loadDrawings, saveDrawing, type SketchDrawing, type SketchStroke } from "@/lib/sketch";

// W0 샘플 제시어 (런칭 볼륨 300개는 W2 — 여기선 감 검증용 축소 풀)
const SAMPLE_WORDS = [
  "기타", "드럼", "응원봉", "앵콜", "무대", "마이크",
  "우산", "라면", "지하철", "고래", "무지개", "달",
  "케이크", "안경", "눈사람", "로켓", "피아노", "커피",
];
const pick3 = () => [...SAMPLE_WORDS].sort(() => Math.random() - 0.5).slice(0, 3);

type Phase = { name: "pick"; words: string[] } | { name: "draw"; word: string } | { name: "gallery"; drawings: SketchDrawing[]; idx: number };

export default function SketchProtoPage() {
  // 초기 제시어·저장 수는 클라이언트에서만 계산 — SSR 초기 HTML과의 hydration 불일치(랜덤·localStorage) 방지
  const [phase, setPhase] = useState<Phase>({ name: "pick", words: [] });
  const [savedCount, setSavedCount] = useState(0);
  useEffect(() => {
    setPhase((p) => (p.name === "pick" && p.words.length === 0 ? { name: "pick", words: pick3() } : p));
    setSavedCount(loadDrawings().length);
  }, []);

  const submit = (word: string) => (strokes: SketchStroke[], durationMs: number) => {
    const d: SketchDrawing = { word, strokes, durationMs, createdAt: new Date().toISOString() };
    saveDrawing(d);
    setSavedCount(loadDrawings().length);
    setPhase({ name: "gallery", drawings: loadDrawings(), idx: 0 });
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col gap-4 px-5 pb-8 pt-6 px-safe pb-safe pt-safe">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {phase.name !== "pick" && (
            <button onClick={() => setPhase({ name: "pick", words: pick3() })} aria-label="뒤로" className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-muted">
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <h1 className="text-[19px] font-black text-fg">CELEB 스케치</h1>
          <span className="ml-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-black text-gold">W0 프로토타입</span>
        </div>
        {phase.name === "pick" && savedCount > 0 && (
          <button
            onClick={() => setPhase({ name: "gallery", drawings: loadDrawings(), idx: 0 })}
            className="rounded-full bg-surface-1 px-3.5 py-1.5 text-[12.5px] font-bold text-muted ring-1 ring-hairline"
          >
            내 그림 {savedCount}
          </button>
        )}
      </div>

      {phase.name === "pick" && (
        <div className="flex flex-col gap-3">
          <p className="text-[13.5px] leading-relaxed text-muted break-keep">
            제시어를 하나 골라 60초 안에 그려보세요. 제출하면 그려지는 과정이 리플레이로 재생돼요 — 이 손맛과 보는 재미가
            검증 포인트예요.
          </p>
          {phase.words.map((w) => (
            <button
              key={w}
              onClick={() => setPhase({ name: "draw", word: w })}
              className="rounded-[16px] bg-surface-1 py-4 text-[16px] font-black text-fg ring-1 ring-hairline active:scale-[0.99]"
            >
              {w}
            </button>
          ))}
          <button onClick={() => setPhase({ name: "pick", words: pick3() })} className="text-[12.5px] font-bold text-subtle">
            다른 제시어 보기
          </button>
        </div>
      )}

      {phase.name === "draw" && <SketchCanvas word={phase.word} onSubmit={submit(phase.word)} />}

      {phase.name === "gallery" && phase.drawings.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-black text-fg">
              제시어 <span className="text-primary-400">{phase.drawings[phase.idx].word}</span>
            </span>
            <span className="text-[12px] font-bold tabular-nums text-subtle">
              {phase.idx + 1}/{phase.drawings.length}
            </span>
          </div>
          <SketchReplay strokes={phase.drawings[phase.idx].strokes} />
          <div className="flex gap-2">
            <button
              onClick={() => setPhase({ ...phase, idx: (phase.idx + phase.drawings.length - 1) % phase.drawings.length })}
              disabled={phase.drawings.length < 2}
              className="flex-1 rounded-full bg-surface-1 py-3 text-[13.5px] font-bold text-muted ring-1 ring-hairline disabled:opacity-40"
            >
              이전 그림
            </button>
            <button
              onClick={() => setPhase({ ...phase, idx: (phase.idx + 1) % phase.drawings.length })}
              disabled={phase.drawings.length < 2}
              className="flex-1 rounded-full bg-surface-1 py-3 text-[13.5px] font-bold text-muted ring-1 ring-hairline disabled:opacity-40"
            >
              다음 그림
            </button>
          </div>
          <button
            onClick={() => setPhase({ name: "pick", words: pick3() })}
            className="w-full rounded-full bg-primary py-3.5 text-[15px] font-black text-white active:scale-[0.99]"
          >
            새로 그리기
          </button>
        </div>
      )}
    </div>
  );
}
