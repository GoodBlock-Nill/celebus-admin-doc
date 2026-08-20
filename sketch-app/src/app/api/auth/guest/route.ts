import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { hashWithSalt, getClientIp } from "@/lib/hash";
import { readVoterId, signAnonId, VID_COOKIE, VID_COOKIE_OPTS } from "@/lib/anon-identity";
import { assertSameOrigin } from "@/lib/origin";

// 게스트 신원 발급 — 스케치 테스트 기간 전용 (SKETCH_GUEST_MODE=1 배포에서만 동작).
// CELEBUS SSO 없이 기기별 익명 신원(vid 쿠키)을 만들어 전 기능을 테스트한다.
// 같은 사무실 IP에서 다인 파티 테스트가 가능하도록 발급 캡을 넉넉히 (50/일).
// 정식 오픈 시 SKETCH_GUEST_MODE·NEXT_PUBLIC_SKETCH_GUEST env 제거 → SSO 게이트 복귀.
const GUEST_CAP = 50;
const GUEST_WINDOW_SECS = 60 * 60 * 24;

export async function POST(req: Request) {
  if (process.env.SKETCH_GUEST_MODE !== "1") return NextResponse.json({ error: "not_available" }, { status: 404 });
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });

  const { id: anonId, isNew } = readVoterId(req);
  if (isNew) {
    const { data: granted } = await admin().rpc("claim_anon_id", {
      p_ip_hash: hashWithSalt(getClientIp(req)),
      p_anon_id: anonId,
      p_cap: GUEST_CAP,
      p_window_secs: GUEST_WINDOW_SECS,
    });
    if (!granted) return NextResponse.json({ error: "limit" }, { status: 429 });
  }
  const res = NextResponse.json({ ok: true });
  if (isNew) res.cookies.set(VID_COOKIE, signAnonId(anonId), VID_COOKIE_OPTS);
  return res;
}
