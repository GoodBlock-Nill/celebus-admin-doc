import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { playerHash, hashWithSalt, getClientIp } from "@/lib/hash";
import { assertSameOrigin } from "@/lib/origin";
import { voteThrottled } from "@/lib/ratelimit";
import { readVoterId, signAnonId, VID_COOKIE, VID_COOKIE_OPTS } from "@/lib/anon-identity";
import { simulate } from "@/lib/match-sim";

// IP당 신규 익명 식별자 발급 캡 (쿠키 삭제 반복으로 가짜 플레이어 양산 억제). 공유 IP 오탐 시 env 조정.
const ISSUE_CAP = Number(process.env.VOTE_ISSUE_CAP) || 5;
const ISSUE_WINDOW_SECS = Number(process.env.VOTE_ISSUE_WINDOW_SECS) || 60 * 60 * 24;

const scoreSchema = z.object({
  mode: z.enum(["daily", "free"]),
  // seed는 서버 발급값(game_start_match)이 권위 — 여기 값은 참고용, 저장은 matchId의 seed 사용.
  seed: z.number().int().nonnegative().max(2147483647),
  score: z.number().int().min(0).max(1000000),
  level: z.number().int().min(1).max(999),
  // 점수 위조 방어 Phase 1 — 게임 시작 시 발급된 matchId 필수(서버 시간 게이트·1회용 검증).
  match_id: z.string().uuid(),
  // 입력 로그(Step 2a 수집) — 서버 리플레이 검증 준비. 지금은 저장만(점수 판정에 미사용).
  moves: z.array(z.object({ t: z.number(), k: z.string().max(2), a: z.number().int().optional(), b: z.number().int().optional(), c: z.number().int().optional() })).max(3000).optional(),
  nickname: z.string().trim().max(16).optional(),
  avatar: z.string().trim().max(200).optional(), // 아바타 id 또는 (미래) 프사 URL — 렌더용, 길이만 검증
});

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });

  const parsed = scoreSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  const { mode, seed, score, level, match_id, moves, nickname, avatar } = parsed.data;

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

  // 서버 리플레이 검증(Step 2b/2c) — 저장 전에 재생해 위조 판정.
  //   egregious(명백조작: 위법 수>0 또는 클라 점수 > 서버최대×1.5) & 이 모드가 거부 활성이면 저장 전 거부.
  //   그 외/섀도우는 통과시키고 불일치만 기록. 판정용 값은 아래에서 저장·로그에 사용.
  let simVerdict: { egregious: boolean; suspect: boolean; min: number; max: number; illegal: number } | null = null;
  let enforceModes: string[] = [];
  if (moves) {
    try {
      const { data: m } = await admin().from("game_match").select("seed").eq("match_id", match_id).maybeSingle();
      const { data: cfgRow } = await admin().from("game_config").select("config").eq("id", 1).maybeSingle();
      const ig = (cfgRow?.config as { integrity?: { replayEnforceModes?: string[] } } | null)?.integrity ?? {};
      enforceModes = Array.isArray(ig.replayEnforceModes) ? ig.replayEnforceModes : [];
      const sim = simulate(Number(m?.seed ?? seed), moves);
      const egregious = sim.illegal > 0 || score > Math.round(sim.max * 1.5);
      const suspect = egregious || score > Math.round(sim.max * 1.05);
      simVerdict = { egregious, suspect, min: sim.min, max: sim.max, illegal: sim.illegal };
      if (egregious && enforceModes.includes(mode)) {
        await admin()
          .from("game_admin_log")
          .insert({ action: "replay_rejected", target: playerHash(anonId), detail: { mode, score, sim_max: sim.max, illegal: sim.illegal, moves: moves.length }, actor: "system" });
        return NextResponse.json({ status: "rejected", reason: "replay_rejected" }, { status: 400 });
      }
    } catch {
      /* 리플레이 실패는 통과(제출 막지 않음) */
    }
  }

  const { data: result, error } = await admin().rpc("game_submit_score", {
    p_player_hash: playerHash(anonId),
    p_nickname: nickname ?? "익명",
    p_avatar: avatar ?? null,
    p_mode: mode,
    p_seed: seed,
    p_score: score,
    p_level: level,
    p_match_id: match_id,
  });
  if (error) return NextResponse.json({ error: "처리 중 오류가 발생했어요." }, { status: 500 });
  if (result?.error) return NextResponse.json({ status: "rejected", reason: result.error }, { status: 400 });

  // 입력 로그 저장 + 불일치 기록(섀도우) + 거부 자동 승격 관리(샘플링).
  if (moves) {
    try {
      await admin().from("game_match").update({ moves, client_score: score }).eq("match_id", match_id);
      if (simVerdict?.suspect) {
        await admin()
          .from("game_admin_log")
          .insert({
            action: "replay_mismatch",
            target: playerHash(anonId),
            detail: { mode, score, sim_min: simVerdict.min, sim_max: simVerdict.max, illegal: simVerdict.illegal, moves: moves.length, egregious: simVerdict.egregious },
            actor: "system",
          });
      }
      // 거부 자동 승격/롤백 — 매 제출마다 하면 비싸므로 샘플링(평균 ~30판마다 1회 평가)
      if (Math.random() < 0.03) await admin().rpc("game_replay_autotune");
    } catch {
      /* best-effort — 실패해도 제출은 성공 처리 */
    }
  }

  const res = NextResponse.json({ status: "ok", ...result });
  if (isNew) res.cookies.set(VID_COOKIE, signAnonId(anonId), VID_COOKIE_OPTS);
  return res;
}
