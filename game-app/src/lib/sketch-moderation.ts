// CELEB 스케치 — AI 1차 검수 (서버 전용, 2026-08-19 확정안).
// 스트로크 로그를 PNG로 렌더해 비전 모델이 판정: approve(즉시 공개) / hold(운영자 보류 큐) / reject(자동 반려).
// 안전 폴백: API 키 부재·호출 실패·판정 파싱 실패 = hold (공개가 멈출지언정 사고는 안 난다).
// 글자 감지는 reject가 아닌 hold — 오탐 시 운영자가 승인하면 그만 (정답 글자 반칙 §4.1).
import { createCanvas } from "@napi-rs/canvas";
import type { SketchStroke } from "./sketch";

export type ModerationVerdict = {
  action: "approve" | "hold" | "reject";
  reason: string;
  model?: string;
};

const RENDER_SIZE = 512;
const PAPER = "#fdfcf8";
const MODEL = process.env.SKETCH_MODERATION_MODEL || "claude-haiku-4-5-20251001";

export function renderStrokesPng(strokes: SketchStroke[]): Buffer {
  const cv = createCanvas(RENDER_SIZE, RENDER_SIZE);
  const ctx = cv.getContext("2d");
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, RENDER_SIZE, RENDER_SIZE);
  for (const s of strokes) {
    if (!s.points.length) continue;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = (s.width / 360) * RENDER_SIZE;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(s.points[0].x * RENDER_SIZE, s.points[0].y * RENDER_SIZE);
    if (s.points.length === 1) ctx.lineTo(s.points[0].x * RENDER_SIZE + 0.01, s.points[0].y * RENDER_SIZE);
    for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x * RENDER_SIZE, s.points[i].y * RENDER_SIZE);
    ctx.stroke();
  }
  return cv.toBuffer("image/png");
}

const PROMPT = `You are moderating a user-submitted drawing from a family-friendly K-pop fan drawing-and-guessing game (like Pictionary). The drawing was made with a limited 8-color pen tool in 60 seconds — expect crude, simple doodles; that is normal and fine.

Classify the image. Respond with ONLY a JSON object, no other text:
{"action": "approve" | "hold" | "reject", "reason": "<short reason in Korean>"}

- "approve": normal drawing attempt, even if unrecognizable scribbles.
- "hold" (needs human review): contains written letters/words/numbers in any language (writing the answer is cheating), OR is ambiguous/borderline (possibly suggestive shapes, possibly a symbol of hate, unclear).
- "reject" (clear violation): unmistakably sexual/genital imagery, explicit hate symbols (e.g. swastika), graphic violence/gore.

When uncertain between approve and hold, choose hold. When uncertain between hold and reject, choose hold.`;

export async function moderateSketch(strokes: SketchStroke[]): Promise<ModerationVerdict> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { action: "hold", reason: "AI 검수 미설정 — 운영자 확인 필요" };
  try {
    const png = renderStrokesPng(strokes);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/png", data: png.toString("base64") } },
              { type: "text", text: PROMPT },
            ],
          },
        ],
      }),
    });
    if (!res.ok) return { action: "hold", reason: `AI 검수 호출 실패(${res.status}) — 운영자 확인 필요`, model: MODEL };
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((c) => c.type === "text")?.text ?? "";
    const parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as { action?: string; reason?: string };
    if (parsed.action === "approve" || parsed.action === "hold" || parsed.action === "reject") {
      return { action: parsed.action, reason: parsed.reason ?? "", model: MODEL };
    }
    return { action: "hold", reason: "AI 판정 형식 오류 — 운영자 확인 필요", model: MODEL };
  } catch {
    return { action: "hold", reason: "AI 검수 오류 — 운영자 확인 필요", model: MODEL };
  }
}
