// CELEB 스케치 — 스트로크 벡터 로그 모델 + 렌더/리플레이 공용 유틸 (W0 프로토타입).
// 그림은 이미지가 아닌 스트로크 로그로 저장한다 (기획 §2-2: 재미의 본질 = 그려지는 과정의 재생).
// 좌표는 0..1 정규화 — 어떤 화면 크기에서 그렸든 어떤 크기로도 재생 가능.

export type SketchPoint = { x: number; y: number; t: number }; // t = 드로잉 시작 기준 경과 ms
export type SketchStroke = { color: string; width: number; points: SketchPoint[] };
export type SketchDrawing = {
  word: string;
  strokes: SketchStroke[];
  durationMs: number; // 마지막 입력 시점 (리플레이 총 길이 계산용)
  createdAt: string;
};

// 팔레트 8색 (기획 §4.1 — 의도적 제한) + 지우개는 종이색 스트로크로 기록 (재생 로직 단일화)
export const SKETCH_COLORS = ["#1f1f24", "#e5484d", "#f0883e", "#f5c451", "#46a758", "#3e8ef7", "#8b5cf6", "#8d6e52"];
export const SKETCH_PAPER = "#fdfcf8"; // 종이(캔버스) 배경색
export const SKETCH_WIDTHS = [4, 9, 16]; // 기준 캔버스 360px 대비 굵기 3단
export const SKETCH_BASE = 360; // 굵기 스케일 기준 크기

// 한 획을 캔버스에 그린다 (upToMs 지정 시 그 시점까지만 — 리플레이 진행 프레임용)
function drawStroke(ctx: CanvasRenderingContext2D, s: SketchStroke, size: number, upToMs?: number) {
  const pts = upToMs == null ? s.points : s.points.filter((p) => p.t <= upToMs);
  if (pts.length === 0) return;
  ctx.strokeStyle = s.color;
  ctx.lineWidth = (s.width / SKETCH_BASE) * size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(pts[0].x * size, pts[0].y * size);
  if (pts.length === 1) ctx.lineTo(pts[0].x * size + 0.01, pts[0].y * size); // 점 탭도 보이게
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x * size, pts[i].y * size);
  ctx.stroke();
}

export function renderDrawing(ctx: CanvasRenderingContext2D, strokes: SketchStroke[], size: number, upToMs?: number) {
  ctx.fillStyle = SKETCH_PAPER;
  ctx.fillRect(0, 0, size, size);
  for (const s of strokes) drawStroke(ctx, s, size, upToMs);
}

// 리플레이용 타임라인 압축 — 획 사이 생각하는 공백을 최대 400ms로 캡 (Draw Something 패턴: 보는 재미 유지)
const MAX_GAP_MS = 400;
export function compressTimeline(strokes: SketchStroke[]): { strokes: SketchStroke[]; durationMs: number } {
  let shift = 0;
  let prevEnd = 0;
  const out: SketchStroke[] = [];
  for (const s of strokes) {
    if (s.points.length === 0) continue;
    const start = s.points[0].t - shift;
    const gap = start - prevEnd;
    if (gap > MAX_GAP_MS) shift += gap - MAX_GAP_MS;
    const pts = s.points.map((p) => ({ ...p, t: p.t - shift }));
    prevEnd = pts[pts.length - 1].t;
    out.push({ ...s, points: pts });
  }
  return { strokes: out, durationMs: prevEnd };
}

// W0 프로토타입 저장소 — 서버 없이 기기 로컬에 최근 그림 보관 (W1에서 서버 제출로 대체)
const STORE_KEY = "sketch_proto_drawings";
export function loadDrawings(): SketchDrawing[] {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]") as SketchDrawing[];
  } catch {
    return [];
  }
}
export function saveDrawing(d: SketchDrawing) {
  try {
    const list = [d, ...loadDrawings()].slice(0, 10); // 최근 10장
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
  } catch {
    /* 저장 실패는 프로토타입에서 무시 */
  }
}
