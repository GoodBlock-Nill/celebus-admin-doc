"use client";

// CELEB 스케치 — 드로잉 캔버스 (W0 프로토타입).
// 도구는 기획 §4.1의 의도적 제한 그대로: 펜(8색)·굵기 3단·지우개·되돌리기 3회·전체 지우기·제한 60초.
// 스트로크는 정규화 좌표 + 경과 ms로 기록 — 이 로그가 그대로 리플레이·저장 포맷이 된다.
import { useEffect, useRef, useState } from "react";
import { Eraser, RotateCcw, Trash2 } from "lucide-react";
import {
  SKETCH_BASE,
  SKETCH_COLOR_NAMES,
  SKETCH_COLORS,
  SKETCH_PAPER,
  SKETCH_WIDTHS,
  renderDrawing,
  type SketchPoint,
  type SketchStroke,
} from "@/lib/sketch";

const DRAW_SECONDS = 60;
const MAX_UNDO = 3;

export default function SketchCanvas({ word, onSubmit }: { word: string; onSubmit: (strokes: SketchStroke[], durationMs: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [strokes, setStrokes] = useState<SketchStroke[]>([]);
  const [color, setColor] = useState(SKETCH_COLORS[0]);
  const [width, setWidth] = useState(SKETCH_WIDTHS[1]);
  const [eraser, setEraser] = useState(false);
  const [undosLeft, setUndosLeft] = useState(MAX_UNDO);
  const [secondsLeft, setSecondsLeft] = useState(DRAW_SECONDS);
  const current = useRef<SketchStroke | null>(null);
  const startAt = useRef<number>(0); // 첫 획 시작 시각 — 타이머·타임스탬프 기준
  const submitted = useRef(false);

  // 리사이즈 대응 — 캔버스 물리 크기 갱신 후 전체 다시 그리기
  useEffect(() => {
    const cv = canvasRef.current;
    const wrap = wrapRef.current;
    if (!cv || !wrap) return;
    const fit = () => {
      const size = Math.floor(wrap.clientWidth);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = size * dpr;
      cv.height = size * dpr;
      const ctx = cv.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderDrawing(ctx, strokes, size);
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const redraw = (list: SketchStroke[]) => {
    const cv = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !wrap || !ctx) return;
    renderDrawing(ctx, list, wrap.clientWidth);
  };

  // 타이머 — 첫 획부터 시작, 0초에 자동 제출
  useEffect(() => {
    if (strokes.length === 0 && !current.current) return;
    const iv = setInterval(() => {
      const left = DRAW_SECONDS - Math.floor((Date.now() - startAt.current) / 1000);
      setSecondsLeft(Math.max(0, left));
      if (left <= 0) {
        clearInterval(iv);
        finish();
      }
    }, 250);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes.length > 0]);

  const finish = () => {
    if (submitted.current) return;
    submitted.current = true;
    const list = current.current ? [...strokes, current.current] : strokes;
    onSubmit(list, startAt.current ? Date.now() - startAt.current : 0);
  };

  const toPoint = (e: React.PointerEvent): SketchPoint | null => {
    const wrap = wrapRef.current;
    if (!wrap) return null;
    const r = wrap.getBoundingClientRect();
    if (!startAt.current) startAt.current = Date.now();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
      t: Date.now() - startAt.current,
    };
  };

  const onDown = (e: React.PointerEvent) => {
    if (submitted.current || secondsLeft <= 0) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const p = toPoint(e);
    if (!p) return;
    current.current = { color: eraser ? SKETCH_PAPER : color, width: eraser ? SKETCH_WIDTHS[2] : width, points: [p] };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!current.current) return;
    const p = toPoint(e);
    if (!p) return;
    current.current.points.push(p);
    redraw([...strokes, current.current]);
  };
  const onUp = () => {
    if (!current.current) return;
    const done = current.current;
    current.current = null;
    setStrokes((s) => [...s, done]);
  };

  const undo = () => {
    if (undosLeft <= 0 || strokes.length === 0) return;
    setUndosLeft((n) => n - 1);
    setStrokes((s) => {
      const next = s.slice(0, -1);
      redraw(next);
      return next;
    });
  };
  // 전체 지우기 — 60초 압박 속 오탭 한 번에 그림이 사라지지 않도록 2탭 확인 (디자인 리뷰 Critical 반영)
  const [clearArmed, setClearArmed] = useState(false);
  useEffect(() => {
    if (!clearArmed) return;
    const tm = setTimeout(() => setClearArmed(false), 2500);
    return () => clearTimeout(tm);
  }, [clearArmed]);
  const clearAll = () => {
    if (!clearArmed) return setClearArmed(true);
    setClearArmed(false);
    setStrokes(() => {
      redraw([]);
      return [];
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 제시어 + 타이머 */}
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-black text-fg">
          제시어 <span className="text-primary-400">{word}</span>
        </span>
        <span className={`text-[15px] font-black tabular-nums ${secondsLeft <= 10 ? "text-danger" : "text-muted"}`}>
          {strokes.length === 0 && !current.current ? `${DRAW_SECONDS}초` : `${secondsLeft}초`}
        </span>
      </div>

      {/* 종이 캔버스 (1:1) */}
      <div ref={wrapRef} className="relative aspect-square w-full touch-none overflow-hidden rounded-[16px] ring-1 ring-hairline">
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          style={{ background: SKETCH_PAPER }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
        {strokes.length === 0 && !current.current && (
          <span className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[13px] font-bold text-black/25">
            여기에 그려보세요 — 첫 획부터 타이머가 시작돼요
          </span>
        )}
      </div>

      {/* 팔레트 — 터치 타깃 44px (시각 크기는 34px, hit 영역은 버튼 전체) */}
      <div className="flex items-center justify-between">
        {SKETCH_COLORS.map((c, i) => (
          <button
            key={c}
            onClick={() => {
              setColor(c);
              setEraser(false);
            }}
            aria-label={SKETCH_COLOR_NAMES[i]}
            className="flex h-11 w-11 shrink-0 items-center justify-center"
          >
            <span
              className={`h-[34px] w-[34px] rounded-full transition-transform ${!eraser && color === c ? "scale-110 ring-2 ring-white" : "ring-1 ring-white/25"}`}
              style={{ background: c }}
            />
          </button>
        ))}
      </div>

      {/* 도구 줄 — 굵기·지우개·되돌리기·전체 지우기 (터치 타깃 44px) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {SKETCH_WIDTHS.map((w, wi) => (
            <button
              key={w}
              onClick={() => {
                setWidth(w);
                setEraser(false);
              }}
              aria-label={`굵기 ${wi + 1}단`}
              className={`flex h-11 w-11 items-center justify-center rounded-[10px] ring-1 ${!eraser && width === w ? "bg-primary/25 ring-primary-400" : "bg-surface-1 ring-hairline"}`}
            >
              <span className="rounded-full" style={{ width: w * 0.9, height: w * 0.9, background: eraser ? "#666" : color }} />
            </button>
          ))}
          <button
            onClick={() => setEraser((v) => !v)}
            aria-label="지우개"
            className={`flex h-11 w-11 items-center justify-center rounded-[10px] ring-1 ${eraser ? "bg-primary/25 ring-primary-400 text-primary-400" : "bg-surface-1 ring-hairline text-muted"}`}
          >
            <Eraser className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={undosLeft <= 0 || strokes.length === 0}
            aria-label={`되돌리기 (${undosLeft}회 남음)`}
            className="flex h-11 items-center gap-1 rounded-[10px] bg-surface-1 px-3 text-[12px] font-bold text-muted ring-1 ring-hairline disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" /> {undosLeft}
          </button>
          <button
            onClick={clearAll}
            disabled={strokes.length === 0}
            aria-label={clearArmed ? "한 번 더 탭하면 전체 지워요" : "전체 지우기"}
            className={`flex h-11 items-center justify-center gap-1 rounded-[10px] px-3 text-[12px] font-bold ring-1 disabled:opacity-40 ${
              clearArmed ? "bg-danger/20 text-danger ring-danger/50" : "bg-surface-1 text-muted ring-hairline"
            }`}
          >
            <Trash2 className="h-4 w-4" />
            {clearArmed && "한 번 더!"}
          </button>
        </div>
      </div>

      <button
        onClick={finish}
        disabled={strokes.length === 0}
        className="w-full rounded-full bg-primary py-3.5 text-[15px] font-black text-white active:scale-[0.99] disabled:opacity-40"
      >
        제출하기
      </button>
    </div>
  );
}
