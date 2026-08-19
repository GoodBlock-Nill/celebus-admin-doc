// CELEB 스케치 — AI 1차 검수 v2 (서버 전용).
// v2 개선 (2026-08-19 P0~P1):
//  · 과정 판정 — 최종본만 보면 "그렸다가 덮기" 악용에 뚫린다 (유저는 리플레이로 전 과정을 봄).
//    진행 25/50/75/100% 프레임 4장을 한 호출로 판정, 어느 프레임이든 위반 = 위반.
//  · 제시어 컨텍스트 — 형태 오해 보류 완화 + "정답 글자를 그대로 썼는지" 정밀 판정.
//  · tool use 스키마 강제 — JSON 파싱 실패 제거. 호출 실패 1회 재시도.
//  · 지우개/덮기 휴리스틱 — 종이색 스트로크 비중 과다 시 AI에 신호 + 극단값은 승인 불가(보류 승격).
// 안전 폴백 유지: 키 부재·재시도 실패 = hold (공개가 멈출지언정 사고는 안 난다).
import { createCanvas } from "@napi-rs/canvas";
import type { SketchStroke } from "./sketch";

export type ModerationVerdict = {
  action: "approve" | "hold" | "reject";
  reason: string;
  model?: string;
  eraser_ratio?: number;
};

const RENDER_SIZE = 512;
const PAPER = "#fdfcf8";
const MODEL = process.env.SKETCH_MODERATION_MODEL || "claude-haiku-4-5-20251001";
const FRAMES = [0.25, 0.5, 0.75, 1] as const;
// 종이색(덮기) 스트로크 비중 — 0.35+ = AI에 신호, 0.6+ = approve여도 hold 승격
const ERASER_WARN = 0.35;
const ERASER_FORCE_HOLD = 0.6;

function renderFrame(strokes: SketchStroke[], upToMs?: number): Buffer {
  const cv = createCanvas(RENDER_SIZE, RENDER_SIZE);
  const ctx = cv.getContext("2d");
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, RENDER_SIZE, RENDER_SIZE);
  for (const s of strokes) {
    const pts = upToMs == null ? s.points : s.points.filter((p) => p.t <= upToMs);
    if (!pts.length) continue;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = (s.width / 360) * RENDER_SIZE;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(pts[0].x * RENDER_SIZE, pts[0].y * RENDER_SIZE);
    if (pts.length === 1) ctx.lineTo(pts[0].x * RENDER_SIZE + 0.01, pts[0].y * RENDER_SIZE);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x * RENDER_SIZE, pts[i].y * RENDER_SIZE);
    ctx.stroke();
  }
  return cv.toBuffer("image/png");
}

// P2: 최종본 렌더 재사용 (썸네일 업로드용)
export function renderFinalPng(strokes: SketchStroke[]): Buffer {
  return renderFrame(strokes);
}

function eraserRatio(strokes: SketchStroke[]): number {
  let paper = 0;
  let total = 0;
  for (const s of strokes) {
    total += s.points.length;
    if (s.color.toLowerCase() === PAPER) paper += s.points.length;
  }
  return total > 0 ? paper / total : 0;
}

const buildPrompt = (word: { ko?: string; en?: string; ja?: string }, eraser: number) => `You are moderating a user-submitted drawing from a family-friendly K-pop fan drawing-and-guessing game (like Pictionary). The prompt word the user was asked to draw is: "${word.ko ?? ""}" (en: "${word.en ?? ""}", ja: "${word.ja ?? ""}").

You are given 4 frames showing the drawing IN PROGRESS (25% → 50% → 75% → final). Viewers watch the full drawing replay, so a violation in ANY frame is a violation — including shapes that were later erased or painted over.${eraser >= ERASER_WARN ? `\nNote: ${Math.round(eraser * 100)}% of strokes use the paper color (erasing/covering). Check earlier frames extra carefully for content that was covered up.` : ""}

Expect crude, simple doodles made with an 8-color pen in 60 seconds — that is normal. Judge:
- "approve": a normal drawing attempt of the prompt word, even if unrecognizable scribbles.
- "hold" (human review): clearly legible letters, numbers, or the answer word written as text in any language/frame (writing the answer is cheating); OR ambiguous/borderline content (possibly suggestive shapes, possible hate symbol, unclear). Decorative curves or scribbles that merely resemble writing are NOT letters — only flag text a person can actually read.
- "reject" (clear violation): unmistakably sexual/genital imagery, explicit hate symbols, graphic violence/gore — in any frame.

When uncertain between approve and hold, choose hold. When uncertain between hold and reject, choose hold.`;

const VERDICT_TOOL = {
  name: "submit_verdict",
  description: "Submit the moderation verdict for this drawing.",
  input_schema: {
    type: "object" as const,
    properties: {
      action: { type: "string", enum: ["approve", "hold", "reject"] },
      reason: { type: "string", description: "짧은 판정 사유 (한국어)" },
    },
    required: ["action", "reason"],
  },
};

async function callOnce(images: Buffer[], prompt: string, apiKey: string): Promise<ModerationVerdict | null> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      tools: [VERDICT_TOOL],
      tool_choice: { type: "tool", name: "submit_verdict" },
      messages: [
        {
          role: "user",
          content: [
            ...images.map((png) => ({
              type: "image" as const,
              source: { type: "base64" as const, media_type: "image/png" as const, data: png.toString("base64") },
            })),
            { type: "text" as const, text: prompt },
          ],
        },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { content?: { type: string; name?: string; input?: { action?: string; reason?: string } }[] };
  const tool = data.content?.find((c) => c.type === "tool_use" && c.name === "submit_verdict");
  const action = tool?.input?.action;
  if (action === "approve" || action === "hold" || action === "reject") {
    return { action, reason: tool?.input?.reason ?? "", model: MODEL };
  }
  return null;
}

export async function moderateSketch(
  strokes: SketchStroke[],
  word: { ko?: string; en?: string; ja?: string }
): Promise<ModerationVerdict> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const eraser = eraserRatio(strokes);
  if (!apiKey) return { action: "hold", reason: "AI 검수 미설정 — 운영자 확인 필요", eraser_ratio: eraser };

  try {
    const totalMs = Math.max(1, ...strokes.flatMap((s) => s.points.map((p) => p.t)));
    const images = FRAMES.map((f) => renderFrame(strokes, totalMs * f));
    const prompt = buildPrompt(word, eraser);

    let verdict = await callOnce(images, prompt, apiKey);
    if (!verdict) {
      await new Promise((r) => setTimeout(r, 700)); // 일시 오류 대비 1회 재시도
      verdict = await callOnce(images, prompt, apiKey);
    }
    if (!verdict) return { action: "hold", reason: "AI 검수 호출 실패 — 운영자 확인 필요", model: MODEL, eraser_ratio: eraser };

    // 덮기 비중 극단값 — AI가 승인해도 사람이 확인 (과정 악용 최후 방어선)
    if (verdict.action === "approve" && eraser >= ERASER_FORCE_HOLD) {
      return { action: "hold", reason: `덮기 스트로크 ${Math.round(eraser * 100)}% — 과정 확인 필요`, model: MODEL, eraser_ratio: eraser };
    }
    return { ...verdict, eraser_ratio: eraser };
  } catch {
    return { action: "hold", reason: "AI 검수 오류 — 운영자 확인 필요", model: MODEL, eraser_ratio: eraser };
  }
}
