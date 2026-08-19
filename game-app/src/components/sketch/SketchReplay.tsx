"use client";

// CELEB 스케치 — 스트로크 리플레이 뷰어 (W0 프로토타입).
// 이 장르 재미의 본질: 완성본이 아니라 "그려지는 과정"을 보여주는 것 (기획 §2-2).
// 타임라인은 압축본(획 간 공백 캡)을 재생하고, 배속(1/2/4)과 진행 바를 제공한다.
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { compressTimeline, renderDrawing, type SketchStroke } from "@/lib/sketch";

const SPEEDS = [1, 2, 4] as const;

export default function SketchReplay({ strokes, autoPlay = true }: { strokes: SketchStroke[]; autoPlay?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [progress, setProgress] = useState(0); // 0..1
  const posRef = useRef(0); // 재생 위치 ms (압축 타임라인 기준)
  const timeline = useRef(compressTimeline(strokes));

  useEffect(() => {
    timeline.current = compressTimeline(strokes);
    posRef.current = 0;
    setProgress(0);
    setPlaying(autoPlay);
  }, [strokes, autoPlay]);

  // 캔버스 준비 + 리사이즈
  useEffect(() => {
    const cv = canvasRef.current;
    const wrap = wrapRef.current;
    if (!cv || !wrap) return;
    const fit = () => {
      const size = Math.floor(wrap.clientWidth);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = size * dpr;
      cv.height = size * dpr;
      cv.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const paint = () => {
    const cv = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !wrap || !ctx) return;
    renderDrawing(ctx, timeline.current.strokes, wrap.clientWidth, posRef.current);
  };

  // 재생 루프
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const { durationMs } = timeline.current;
      posRef.current = Math.min(durationMs, posRef.current + (now - last) * speed);
      last = now;
      paint();
      setProgress(durationMs > 0 ? posRef.current / durationMs : 1);
      if (posRef.current >= durationMs) return setPlaying(false);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed]);

  const togglePlay = () => {
    // 끝까지 본 뒤 재생 = 처음부터
    if (!playing && posRef.current >= timeline.current.durationMs) {
      posRef.current = 0;
      setProgress(0);
    }
    setPlaying((v) => !v);
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div ref={wrapRef} className="relative aspect-square w-full overflow-hidden rounded-[16px] ring-1 ring-hairline">
        <canvas ref={canvasRef} className="h-full w-full" onClick={togglePlay} />
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={togglePlay}
          aria-label={playing ? "일시정지" : "재생"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white active:scale-95"
        >
          {playing ? <Pause className="h-4.5 w-4.5" /> : <Play className="ml-0.5 h-4.5 w-4.5" />}
        </button>
        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-1 ring-1 ring-hairline">
          <div className="h-full rounded-full bg-primary transition-[width] duration-100" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="flex shrink-0 gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`rounded-full px-2.5 py-1 text-[11.5px] font-black tabular-nums ring-1 ${speed === s ? "bg-primary/25 text-primary-400 ring-primary-400" : "bg-surface-1 text-subtle ring-hairline"}`}
            >
              x{s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
