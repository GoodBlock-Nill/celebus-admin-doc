import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { createCommentSchema } from "@/lib/schema";
import { hashWithSalt, getClientIp } from "@/lib/hash";
import { containsProfanity } from "@/lib/profanity";
import { assertSameOrigin } from "@/lib/origin";

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });

  const parsed = createCommentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." }, { status: 400 });
  }
  const { post_id, nickname, password, body, op_password } = parsed.data;
  const authorMode = !!(op_password && op_password.length);

  if (containsProfanity(body, nickname ?? "")) {
    return NextResponse.json({ error: "부적절한 표현이 포함되어 있어요." }, { status: 400 });
  }

  const db = admin();
  const authorHash = hashWithSalt(getClientIp(req));

  // 레이트리밋: 10초 1건 / 1시간 30건
  const { data: c10 } = await db.rpc("recent_comment_count", { p_author_hash: authorHash, p_seconds: 10 });
  if ((c10 ?? 0) >= 1) {
    return NextResponse.json({ error: "너무 빠르게 작성하고 있어요. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }
  const { data: c3600 } = await db.rpc("recent_comment_count", { p_author_hash: authorHash, p_seconds: 3600 });
  if ((c3600 ?? 0) >= 30) {
    return NextResponse.json({ error: "시간당 작성 한도를 초과했어요. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const { data: id, error } = await db.rpc("create_comment", {
    p_post_id: post_id,
    p_body: body,
    p_author_hash: authorHash,
    p_nickname: nickname ?? null,
    p_password: password ?? null,
    p_op_password: op_password ?? null,
  });
  if (error) return NextResponse.json({ error: "저장 중 오류가 발생했어요." }, { status: 500 });
  if (!id) {
    return authorMode
      ? NextResponse.json({ error: "글 비밀번호가 일치하지 않아요." }, { status: 401 })
      : NextResponse.json({ error: "저장 중 오류가 발생했어요." }, { status: 500 });
  }
  return NextResponse.json({ id });
}
