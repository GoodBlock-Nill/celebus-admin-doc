import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { anon } from "@/lib/db-anon";
import { createEntrySchema } from "@/lib/schema";
import { hashWithSalt, getClientIp } from "@/lib/hash";
import { containsProfanity } from "@/lib/profanity";
import { assertSameOrigin } from "@/lib/origin";
import { resolveEntryUrl } from "@/lib/embed/resolve";
import type { ContestType } from "@/lib/types";

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });

  const parsed = createEntrySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." }, { status: 400 });
  }
  const { contest_id, url, title, description, handle, celebus_nickname, phone, password } = parsed.data;

  if (containsProfanity(title, description, handle ?? "", celebus_nickname)) {
    return NextResponse.json({ error: "부적절한 표현이 포함되어 있어요." }, { status: 400 });
  }

  // 콘테스트 유형 확인 (공개 뷰 — draft는 애초에 안 보임)
  const { data: contest } = await anon()
    .from("contests_public")
    .select("id, contest_type")
    .eq("id", contest_id)
    .maybeSingle();
  if (!contest) return NextResponse.json({ error: "콘테스트를 찾을 수 없어요." }, { status: 404 });

  // 클라이언트가 보낸 URL을 서버에서 다시 파싱·검증 (신뢰 금지)
  const resolved = await resolveEntryUrl(url, contest.contest_type as ContestType);
  if (!resolved.ok) {
    return NextResponse.json({ code: resolved.code, error: "지원하지 않는 링크예요." }, { status: 422 });
  }

  // 도용 방지: 핸들은 링크의 실제 작성자가 원칙 — 유저 입력은 자동 추출 불가 플랫폼에서만 사용
  const finalHandle = resolved.authorHandle ?? handle ?? null;
  const handleVerified = resolved.authorHandle !== null;
  if (!finalHandle) {
    return NextResponse.json({ error: "SNS 핸들을 입력해주세요." }, { status: 400 });
  }

  const db = admin();
  const authorHash = hashWithSalt(getClientIp(req));

  // 레이트리밋: 60초 1건 / 1시간 5건
  const { data: c60 } = await db.rpc("contest_recent_entry_count", { p_author_hash: authorHash, p_seconds: 60 });
  if ((c60 ?? 0) >= 1) {
    return NextResponse.json({ error: "너무 빠르게 출품하고 있어요. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }
  const { data: c3600 } = await db.rpc("contest_recent_entry_count", { p_author_hash: authorHash, p_seconds: 3600 });
  if ((c3600 ?? 0) >= 5) {
    return NextResponse.json({ error: "시간당 출품 한도를 초과했어요. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const { data: result, error } = await db.rpc("contest_create_entry", {
    p_contest_id: contest_id,
    p_platform: resolved.parsed.platform,
    p_source_url: resolved.parsed.canonicalUrl,
    p_external_id: resolved.parsed.externalId,
    p_oembed: resolved.oembed,
    p_title: title,
    p_description: description,
    p_handle: finalHandle,
    p_handle_verified: handleVerified,
    p_celebus_nickname: celebus_nickname,
    p_phone: phone,
    p_consent_official: true,
    p_password: password,
    p_author_hash: authorHash,
  });
  if (error || !result) {
    return NextResponse.json({ error: "저장 중 오류가 발생했어요." }, { status: 500 });
  }
  if (result === "closed" || result === "not_found") {
    return NextResponse.json({ code: "closed", error: "접수 기간이 아니에요." }, { status: 400 });
  }
  if (result === "duplicate") {
    return NextResponse.json({ code: "duplicate", error: "이미 출품된 작품이에요." }, { status: 409 });
  }
  return NextResponse.json({ id: result });
}
