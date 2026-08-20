// CELEB 스케치 — 클라이언트 API (W1). 실패는 null/ok:false로 흡수해 화면에서 안내.
import type { SketchStroke } from "./sketch";

export type SketchWordChoice = { id: string; text: string; difficulty: number };
export type SketchAssignment = {
  drawing: { id: string; strokes: SketchStroke[]; duration_ms: number };
  answer_len: number;
  tiles: string[];
  tile_lang?: "ko" | "en" | "ja";
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
export type SketchModeration = "approve" | "hold" | "reject" | "processing";

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

export type SketchDailyItem = {
  slot: number;
  tile_lang?: "ko" | "en" | "ja";
  drawing: { id: string; strokes: SketchStroke[]; duration_ms: number };
  mine: boolean;
  done: boolean;
  correct: boolean;
  word: string | null;
  answer_len: number;
  tiles: string[] | null;
  tries_left: number;
};
export type SketchDaily = { day: string; items: SketchDailyItem[]; bonus_claimed: boolean };
export type SketchBest = { week_start: string; correct_count: number; word: string; strokes: SketchStroke[]; thumb_url: string | null };

export async function fetchSketchDaily(lang = "ko"): Promise<SketchDaily | null> {
  try {
    const res = await fetch(`/api/sketch/daily?lang=${lang}`);
    if (!res.ok) return null;
    return (await res.json()) as SketchDaily;
  } catch {
    return null;
  }
}

export async function claimSketchDailyBonus(): Promise<{ ok?: boolean; cp?: number; error?: string } | null> {
  try {
    const res = await fetch("/api/sketch/daily/bonus", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchSketchBest(): Promise<SketchBest | null> {
  try {
    const res = await fetch("/api/sketch/best");
    if (!res.ok) return null;
    return ((await res.json()).best ?? null) as SketchBest | null;
  } catch {
    return null;
  }
}

export async function fetchSketchHint(
  drawingId: string,
  lang = "ko",
  tiles: string[] = []
): Promise<{ remove?: number[]; charged?: number; error?: string } | null> {
  try {
    const res = await fetch("/api/sketch/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drawing_id: drawingId, lang, tiles }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchSketchAssignment(lang = "ko"): Promise<SketchAssignment | "empty" | null> {
  try {
    const res = await fetch(`/api/sketch/assign?lang=${lang}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.empty) return "empty";
    return data as SketchAssignment;
  } catch {
    return null;
  }
}

export async function submitSketchGuess(drawingId: string, answer: string, lang = "ko"): Promise<SketchGuessResult | null> {
  try {
    const res = await fetch("/api/sketch/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drawing_id: drawingId, answer, lang }),
    });
    if (!res.ok) return null;
    return (await res.json()) as SketchGuessResult;
  } catch {
    return null;
  }
}
