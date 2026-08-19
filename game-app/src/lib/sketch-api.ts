// CELEB 스케치 — 클라이언트 API (W1). 실패는 null/ok:false로 흡수해 화면에서 안내.
import type { SketchStroke } from "./sketch";

export type SketchWordChoice = { id: string; text: string; difficulty: number };
export type SketchAssignment = {
  drawing: { id: string; strokes: SketchStroke[]; duration_ms: number };
  answer_len: number;
  tiles: string[];
  tries_left: number;
};
export type SketchGuessResult = {
  correct?: boolean;
  tries?: number;
  tries_left?: number;
  done?: boolean;
  word?: string | null;
  cp_awarded?: number;
  celeb_point?: number;
  error?: string;
};
export type SketchModeration = "approve" | "hold" | "reject";

export async function fetchSketchWords(): Promise<SketchWordChoice[]> {
  try {
    const res = await fetch("/api/sketch/words");
    if (!res.ok) return [];
    return ((await res.json()).words ?? []) as SketchWordChoice[];
  } catch {
    return [];
  }
}

export async function submitSketch(
  wordId: string,
  strokes: SketchStroke[],
  durationMs: number
): Promise<SketchModeration | null> {
  try {
    const res = await fetch("/api/sketch/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word_id: wordId, strokes, duration_ms: durationMs }),
    });
    if (!res.ok) return null;
    return ((await res.json()).moderation ?? "hold") as SketchModeration;
  } catch {
    return null;
  }
}

export async function reportSketch(drawingId: string, reason: "inappropriate" | "letters"): Promise<boolean> {
  try {
    const res = await fetch("/api/sketch/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drawing_id: drawingId, reason }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchSketchHint(drawingId: string): Promise<{ first?: string; charged?: number; error?: string } | null> {
  try {
    const res = await fetch("/api/sketch/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drawing_id: drawingId }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchSketchAssignment(): Promise<SketchAssignment | "empty" | null> {
  try {
    const res = await fetch("/api/sketch/assign");
    if (!res.ok) return null;
    const data = await res.json();
    if (data.empty) return "empty";
    return data as SketchAssignment;
  } catch {
    return null;
  }
}

export async function submitSketchGuess(drawingId: string, answer: string): Promise<SketchGuessResult | null> {
  try {
    const res = await fetch("/api/sketch/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drawing_id: drawingId, answer }),
    });
    if (!res.ok) return null;
    return (await res.json()) as SketchGuessResult;
  } catch {
    return null;
  }
}
