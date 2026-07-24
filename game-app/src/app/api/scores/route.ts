import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { playerHash, hashWithSalt, getClientIp } from "@/lib/hash";
import { assertSameOrigin } from "@/lib/origin";
import { voteThrottled } from "@/lib/ratelimit";
import { readVoterId, signAnonId, VID_COOKIE, VID_COOKIE_OPTS } from "@/lib/anon-identity";

// IP당 신규 익명 식별자 발급 캡 (쿠키 삭제 반복으로 가짜 플레이어 양산 억제). 공유 IP 오탐 시 env 조정.
const ISSUE_CAP = Number(process.env.VOTE_ISSUE_CAP) || 5;
const ISSUE_WINDOW_SECS = Number(process.env.VOTE_ISSUE_WINDOW_SECS) || 60 * 60 * 24;

const scoreSchema = z.object({
  mode: z.enum(["daily", "free"]),
  // 시드 상한 = 클라이언트 생성 범위와 일치 (일반=YYYYMMDD, 아이템=random 0~2^31).
  // ⚠️ 과거 1e8 상한이 아이템 매치 시드의 ~95%를 거절해 랭킹 미등록 버그 유발(2026-07-24 정정).
  seed: z.number().int().nonnegative().max(2147483647),
  score: z.number().int().min(0).max(1000000),
  level: z.number().int().min(1).max(999),
  nickname: z.string().trim().max(16).optional(),
  avatar: z.string().trim().max(200).optional(), // 아바타 id 또는 (미래) 프사 URL — 렌더용, 길이만 검증
});

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });

  const parsed = scoreSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  const { mode, seed, score, level, nickname, avatar } = parsed.data;

  const ip = getClientIp(req);
  // IP 총량 스로틀 — 한 IP에서 대량 점수 제출로 랭킹 부풀리기 차단
  if (voteThrottled(ip)) return NextResponse.json({ status: "limit" });

  // 서명 쿠키에서 플레이어 신원 확보. 신규면 IP당 발급 캡 검사.
  const { id: anonId, isNew } = readVoterId(req);
  if (isNew) {
    const { data: granted } = await admin().rpc("claim_anon_id", {
      p_ip_hash: hashWithSalt(ip),
      p_anon_id: anonId,
      p_cap: ISSUE_CAP,
      p_window_secs: ISSUE_WINDOW_SECS,
    });
    if (!granted) return NextResponse.json({ status: "limit" });
  }

  const { data: result, error } = await admin().rpc("game_submit_score", {
    p_player_hash: playerHash(anonId),
    p_nickname: nickname ?? "익명",
    p_avatar: avatar ?? null,
    p_mode: mode,
    p_seed: seed,
    p_score: score,
    p_level: level,
  });
  if (error) return NextResponse.json({ error: "처리 중 오류가 발생했어요." }, { status: 500 });
  if (result?.error) return NextResponse.json({ status: "rejected", reason: result.error }, { status: 400 });

  const res = NextResponse.json({ status: "ok", ...result });
  if (isNew) res.cookies.set(VID_COOKIE, signAnonId(anonId), VID_COOKIE_OPTS);
  return res;
}
