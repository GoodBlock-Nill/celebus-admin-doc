import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { createStagePostSchema } from "@/lib/schema";
import { checkProfanity } from "@/lib/profanity";
import { assertSameOrigin } from "@/lib/origin";
import { resolveStageUrl } from "@/lib/embed/resolve";
import { requireUserId } from "@/lib/identity";

// 스테이지 상시 업로드 (W1) — 링크 서버 재검증 → RPC 저장. 신원은 identity 레이어(W4에 SSO 전환).
export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ code: "forbidden", error: "허용되지 않은 요청이에요." }, { status: 403 });

  // 로그인 선검사 — 익명에게 링크 해석 리소스를 쓰지 않는다 (W4 익명 불가 정책)
  const user = requireUserId(req);
  if (!user) return NextResponse.json({ code: "login_required", error: "CELEBUS 로그인이 필요해요." }, { status: 401 });

  const parsed = createStagePostSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ code: "bad_input", error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." }, { status: 400 });
  }
  const { stage_id, url, title, description, handle, category } = parsed.data;

  if (await checkProfanity(title, description, handle ?? "")) {
    return NextResponse.json({ code: "profanity", error: "부적절한 표현이 포함되어 있어요." }, { status: 400 });
  }

  // 클라이언트가 보낸 URL을 서버에서 다시 파싱·검증 (신뢰 금지)
  const resolved = await resolveStageUrl(url);
  if (!resolved.ok) {
    return NextResponse.json({ code: resolved.code, error: "지원하지 않는 링크예요." }, { status: 422 });
  }

  const finalHandle = resolved.authorHandle ?? handle ?? null;
  if (!finalHandle) {
    return NextResponse.json({ code: "handle_required", error: "SNS 핸들을 입력해주세요." }, { status: 400 });
  }

  const { data: result, error } = await admin().rpc("stage_create_post", {
    p_stage: stage_id,
    p_owner: user,
    p_platform: resolved.parsed.platform,
    p_source_url: resolved.parsed.canonicalUrl,
    p_external_id: resolved.parsed.externalId,
    p_oembed: resolved.oembed,
    p_title: title,
    p_description: description,
    p_handle: finalHandle,
    p_handle_verified: resolved.authorHandle !== null,
    p_category: category,
  });
  if (error || !result) return NextResponse.json({ code: "server", error: "저장 중 오류가 발생했어요." }, { status: 500 });
  if (result === "not_found") return NextResponse.json({ code: "not_found", error: "스테이지를 찾을 수 없어요." }, { status: 404 });
  if (result === "official_readonly") return NextResponse.json({ code: "official_readonly", error: "공식 아카이브에는 올릴 수 없어요." }, { status: 403 });
  if (result === "closed") return NextResponse.json({ code: "closed", error: "보관된 스테이지에는 올릴 수 없어요." }, { status: 400 });
  if (result === "duplicate") return NextResponse.json({ code: "duplicate", error: "이미 올라온 영상이에요." }, { status: 409 });
  if (result === "rate_capped") return NextResponse.json({ code: "rate_capped", error: "오늘 업로드 한도에 도달했어요. 내일 다시 올려주세요." }, { status: 429 });

  return NextResponse.json({ id: result });
}
