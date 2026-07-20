import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { anon } from "@/lib/db-anon";
import { voteSchema } from "@/lib/schema";
import { voterHash, hashWithSalt, getClientIp } from "@/lib/hash";
import { assertSameOrigin } from "@/lib/origin";
import { voteThrottled } from "@/lib/ratelimit";
import { readVoterId, signAnonId, VID_COOKIE, VID_COOKIE_OPTS } from "@/lib/anon-identity";

type Ctx = { params: Promise<{ id: string }> };

// IP당 신규 익명 식별자 발급 캡 (쿠키 삭제 반복 어뷰징 억제)
const ISSUE_CAP = 5;
const ISSUE_WINDOW_SECS = 60 * 60 * 24; // 24h

export async function POST(req: Request, { params }: Ctx) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }
  // body의 voter는 하위호환용으로만 파싱(무결성엔 미사용 — 서명 쿠키 신원 사용)
  const parsed = voteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });

  const ip = getClientIp(req);
  // IP 총량 스로틀 — 한 IP에서 대량 득표 부풀리기 차단
  if (voteThrottled(ip)) {
    return NextResponse.json({ status: "limit", vote_count: null });
  }

  // 서명 쿠키에서 dedup 신원 확보. 신규면 IP당 발급 캡 검사.
  const { id: anonId, isNew } = readVoterId(req);
  if (isNew) {
    const { data: granted } = await admin().rpc("claim_anon_id", {
      p_ip_hash: hashWithSalt(ip),
      p_anon_id: anonId,
      p_cap: ISSUE_CAP,
      p_window_secs: ISSUE_WINDOW_SECS,
    });
    if (!granted) return NextResponse.json({ status: "limit", vote_count: null });
  }

  const { data: status, error } = await admin().rpc("contest_vote", {
    p_entry_id: id,
    p_voter_hash: voterHash(anonId),
  });
  if (error) return NextResponse.json({ error: "처리 중 오류가 발생했어요." }, { status: 500 });

  let voteCount: number | null = null;
  if (status === "ok") {
    const { data } = await anon().from("contest_entries_public").select("vote_count").eq("id", id).maybeSingle();
    voteCount = data?.vote_count ?? null;
  }
  const res = NextResponse.json({ status, vote_count: voteCount });
  if (isNew) res.cookies.set(VID_COOKIE, signAnonId(anonId), VID_COOKIE_OPTS);
  return res;
}
