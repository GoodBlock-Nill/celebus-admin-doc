import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { createSchema } from "@/lib/schema";
import { hashWithSalt, getClientIp } from "@/lib/hash";
import { containsProfanity } from "@/lib/profanity";
import { assertSameOrigin } from "@/lib/origin";

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." }, { status: 400 });
  }
  const { target, title, nickname, password, body } = parsed.data;

  if (containsProfanity(title, nickname, body)) {
    return NextResponse.json({ error: "부적절한 표현이 포함되어 있어요." }, { status: 400 });
  }

  const db = admin();
  const authorHash = hashWithSalt(getClientIp(req));

  // 레이트리밋: 30초 1건 / 1시간 10건
  const { data: c30 } = await db.rpc("recent_post_count", { p_author_hash: authorHash, p_seconds: 30 });
  if ((c30 ?? 0) >= 1) {
    return NextResponse.json({ error: "너무 빠르게 작성하고 있어요. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }
  const { data: c3600 } = await db.rpc("recent_post_count", { p_author_hash: authorHash, p_seconds: 3600 });
  if ((c3600 ?? 0) >= 10) {
    return NextResponse.json({ error: "시간당 작성 한도를 초과했어요. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const { data: id, error } = await db.rpc("create_post", {
    p_target: target,
    p_title: title,
    p_nickname: nickname,
    p_body: body,
    p_password: password,
    p_author_hash: authorHash,
  });
  if (error || !id) {
    return NextResponse.json({ error: "저장 중 오류가 발생했어요." }, { status: 500 });
  }
  return NextResponse.json({ id });
}
