"use client";

// 파티룸 출제자 캔버스 — SketchCanvas의 축약판: 제출·되돌리기 없음(라운드는 서버 타이머가 끝냄),
// 획이 그려지는 즉시 채널로 중계된다 (live = 그리는 중 부분 획 스로틀, stroke = 확정 획).
import { useEffect, useRef, useState } from "react";
import { Eraser, Trash2 } from "lucide-react";
import { SKETCH_COLOR_NAMES, SKETCH_COLORS, SKETCH_PAPER, SKETCH_WIDTHS, renderDrawing, type SketchPoint, type SketchStroke } from "@/lib/sketch";

const LIVE_THROTTLE_MS = 120;

export default function PartyCanvas({
  onStroke,
  onLive,
  onClear,
  disabled,
}: {
  onStroke: (s: SketchStroke) => void;
  onLive: (s: SketchStroke) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [strokes, setStrokes] = useState<SketchStroke[]>([]);
  const [color, setColor] = useState(SKETCH_COLORS[0]);
  const [width, setWidth] = useState(SKETCH_WIDTHS[1]);
  const [eraser, setEraser] = useState(false);
  const current = useRef<SketchStroke | null>(null);
  const startAt = useRef(0);
  const lastLive = useRef(0);

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
    const wrap = wrapRef.current;
    const ctx = canvasRef.current?.getContext("2d");
    if (!wrap || !ctx) return;
    renderDrawing(ctx, list, wrap.clientWidth);
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
    if (disabled) return;
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
    const now = Date.now();
    if (now - lastLive.current >= LIVE_THROTTLE_MS) {
      lastLive.current = now;
      onLive(current.current);
    }
  };
  const onUp = () => {
    if (!current.current) return;
    const done = current.current;
    current.current = null;
    setStrokes((s) => [...s, done]);
    onStroke(done);
  };

  const clearAll = () => {
    setStrokes(() => {
      redraw([]);
      return [];
    });
    onClear();
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div ref={wrapRef} className="relative aspect-square w-full touch-none overflow-hidden rounded-[16px] ring-1 ring-hairline">
        <canvas ref={canvasRef} className="h-full w-full" style={{ background: SKETCH_PAPER }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
      </div>
      <div className="flex items-center justify-between">
        {SKETCH_COLORS.map((c, i) => (
          <button key={c} onClick={() => { setColor(c); setEraser(false); }} aria-label={SKETCH_COLOR_NAMES[i]} className="flex h-11 w-11 shrink-0 items-center justify-center">
            <span className={`h-[30px] w-[30px] rounded-full transition-transform ${!eraser && color === c ? "scale-110 ring-2 ring-white" : "ring-1 ring-white/25"}`} style={{ background: c }} />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        {SKETCH_WIDTHS.map((w, wi) => (
          <button key={w} onClick={() => { setWidth(w); setEraser(false); }} aria-label={`굵기 ${wi + 1}단`} className={`flex h-11 w-11 items-center justify-center rounded-[10px] ring-1 ${!eraser && width === w ? "bg-primary/25 ring-primary-400" : "bg-surface-1 ring-hairline"}`}>
            <span className="rounded-full" style={{ width: w * 0.9, height: w * 0.9, background: eraser ? "#666" : color }} />
          </button>
        ))}
        <button onClick={() => setEraser((v) => !v)} aria-label="지우개" className={`flex h-11 w-11 items-center justify-center rounded-[10px] ring-1 ${eraser ? "bg-primary/25 ring-primary-400 text-primary-400" : "bg-surface-1 ring-hairline text-muted"}`}>
          <Eraser className="h-4.5 w-4.5" />
        </button>
        <div className="flex-1" />
        <button onClick={clearAll} disabled={strokes.length === 0} aria-label="전체 지우기" className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-surface-1 text-muted ring-1 ring-hairline disabled:opacity-40">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
