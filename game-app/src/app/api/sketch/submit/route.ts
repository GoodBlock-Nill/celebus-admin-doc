import { NextResponse, after } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { playerHash, getClientIp } from "@/lib/hash";
import { peekVoterId } from "@/lib/anon-identity";
import { assertSameOrigin } from "@/lib/origin";
import { voteThrottled } from "@/lib/ratelimit";
import { moderateSketch, renderFinalPng, type ModerationVerdict } from "@/lib/sketch-moderation";

// 그림 제출 + AI 1차 검수 v2:
// 판정을 시작하되 응답은 6초까지만 기다린다 — 제때 끝나면 결과 그대로(approve=즉시 공개 안내),
// 늦으면 pending으로 접수하고 after()에서 마저 판정해 갱신 (제출 버튼이 AI에 볼모 잡히지 않게).
// 크기 상한: 획 400·획당 점 1200 — 60초 드로잉의 정상 상한을 넉넉히 웃도는 값 (폭주 페이로드 차단)
const pointSchema = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1), t: z.number().min(0).max(600000) });
const strokeSchema = z.object({
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  width: z.number().min(1).max(40),
  points: z.array(pointSchema).min(1).max(1200),
});
const bodySchema = z.object({
  word_id: z.string().uuid(),
  strokes: z.array(strokeSchema).min(1).max(400),
  duration_ms: z.number().int().min(0).max(600000),
});

const VERDICT_WAIT_MS = 6000;
const verdictToStatus = (v: ModerationVerdict) => (v.action === "approve" ? "approved" : v.action === "reject" ? "rejected" : "held");

// P2: 판정용 최종 렌더를 썸네일로 재사용 (관리자 큐·공유 카드) — 실패해도 제출은 유효
async function uploadThumb(id: string, strokes: z.infer<typeof strokeSchema>[]): Promise<string | null> {
  try {
    const png = renderFinalPng(strokes);
    const path = `${id}.png`;
    const { error } = await admin().storage.from("sketch-thumbs").upload(path, png, { contentType: "image/png", upsert: true });
    if (error) return null;
    return admin().storage.from("sketch-thumbs").getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });
  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (voteThrottled(getClientIp(req))) return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "잘못된 그림 데이터예요." }, { status: 400 });

  const { data: word } = await admin()
    .from("game_sketch_word")
    .select("id, text")
    .eq("id", parsed.data.word_id)
    .eq("active", true)
    .maybeSingle();
  if (!word) return NextResponse.json({ error: "잘못된 제시어예요." }, { status: 400 });

  // 판정 시작 (제시어 컨텍스트 포함) — 아래에서 6초까지만 동기 대기
  const verdictPromise = moderateSketch(parsed.data.strokes, (word.text ?? {}) as { ko?: string; en?: string; ja?: string });
  const timely = await Promise.race([
    verdictPromise,
    new Promise<null>((r) => setTimeout(() => r(null), VERDICT_WAIT_MS)),
  ]);

  const { data, error } = await admin()
    .from("game_sketch_drawing")
    .insert({
      player_hash: playerHash(anonId),
      word_id: parsed.data.word_id,
      strokes: parsed.data.strokes,
      duration_ms: parsed.data.duration_ms,
      status: timely ? verdictToStatus(timely) : "pending",
      ai_verdict: timely ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return NextResponse.json({ error: "제출에 실패했어요." }, { status: 500 });

  after(async () => {
    // 늦게 도착한 판정 반영 (pending → 확정)
    if (!timely) {
      const verdict = await verdictPromise;
      await admin()
        .from("game_sketch_drawing")
        .update({ status: verdictToStatus(verdict), ai_verdict: verdict })
        .eq("id", data.id)
        .eq("status", "pending"); // 관리자가 먼저 처리했다면 존중
    }
    const thumb = await uploadThumb(data.id, parsed.data.strokes);
    if (thumb) await admin().from("game_sketch_drawing").update({ thumb_url: thumb }).eq("id", data.id);
  });

  return NextResponse.json({ status: "ok", id: data.id, moderation: timely ? timely.action : "processing" });
}
