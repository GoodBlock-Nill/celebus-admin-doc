import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { likeSchema } from "@/lib/schema";
import { hashWithSalt, getClientIp } from "@/lib/hash";
import { assertSameOrigin } from "@/lib/origin";
import { readVoterId, signAnonId, VID_COOKIE, VID_COOKIE_OPTS } from "@/lib/anon-identity";

type Ctx = { params: Promise<{ id: string }> };

// IP당 신규 익명 식별자 발급 캡 (쿠키 삭제 반복 어뷰징 억제).
// 공유 IP(팬 이벤트 등) 오탐 시 재배포 없이 env로 조정 가능. 기본 5개/24h.
const ISSUE_CAP = Number(process.env.VOTE_ISSUE_CAP) || 5;
const ISSUE_WINDOW_SECS = Number(process.env.VOTE_ISSUE_WINDOW_SECS) || 60 * 60 * 24;

export async function POST(req: Request, { params }: Ctx) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });
  const { id } = await params;
  // body의 voter는 하위호환용으로만 파싱(무결성엔 미사용 — 서명 쿠키 신원 사용)
  const parsed = likeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });

  // 서명 쿠키에서 dedup 신원 확보. 신규면 IP당 발급 캡 검사.
  const { id: anonId, isNew } = readVoterId(req);
  if (isNew) {
    const { data: granted } = await admin().rpc("claim_anon_id", {
      p_ip_hash: hashWithSalt(getClientIp(req)),
      p_anon_id: anonId,
      p_cap: ISSUE_CAP,
      p_window_secs: ISSUE_WINDOW_SECS,
    });
    if (!granted) return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const { data: count, error } = await admin().rpc("like_comment", {
    p_id: id,
    p_voter_hash: hashWithSalt(`like:${anonId}`),
  });
  if (error) return NextResponse.json({ error: "처리 중 오류가 발생했어요." }, { status: 500 });

  const res = NextResponse.json({ like_count: count ?? 0 });
  if (isNew) res.cookies.set(VID_COOKIE, signAnonId(anonId), VID_COOKIE_OPTS);
  return res;
}
