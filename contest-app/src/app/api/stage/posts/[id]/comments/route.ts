import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { assertSameOrigin } from "@/lib/origin";
import { checkProfanity } from "@/lib/profanity";
import { requireUserId, peekUserId } from "@/lib/identity";

const bodySchema = z.object({
  body: z.string().trim().min(1).max(200),
  parent_id: z.string().uuid().nullable().optional(),
});

// 댓글 작성 (W2) — 200자·대댓글 1단·금칙어·분당 5건(RPC)
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!assertSameOrigin(req)) return NextResponse.json({ code: "forbidden", error: "허용되지 않은 요청이에요." }, { status: 403 });
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ code: "bad_input", error: "잘못된 요청이에요." }, { status: 400 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ code: "bad_input", error: "입력값을 확인해주세요." }, { status: 400 });
  if (await checkProfanity(parsed.data.body)) return NextResponse.json({ code: "profanity", error: "부적절한 표현이 포함되어 있어요." }, { status: 400 });

  const user = requireUserId(req);
  if (!user) return NextResponse.json({ code: "login_required", error: "CELEBUS 로그인이 필요해요." }, { status: 401 });
  const { data, error } = await admin().rpc("comment_create", {
    p_post: id,
    p_owner: user,
    p_body: parsed.data.body,
    p_parent: parsed.data.parent_id ?? null,
  });
  if (error || !data) return NextResponse.json({ code: "server", error: "처리 중 오류가 발생했어요." }, { status: 500 });
  if (data.error) {
    const map: Record<string, [string, number]> = {
      not_found: ["not_found", 404],
      bad_body: ["bad_input", 400],
      too_deep: ["bad_input", 400],
      rate_capped: ["rate_capped", 429],
    };
    const [code, status] = map[String(data.error)] ?? ["server", 500];
    return NextResponse.json({ code, error: "댓글을 등록할 수 없어요." }, { status });
  }
  return NextResponse.json({ id: data.id });
}

// 내 댓글 id 목록 (삭제 버튼 표시용)
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ mine: [] });
  const user = peekUserId(req);
  if (!user) return NextResponse.json({ mine: [] });
  const { data } = await admin().rpc("comment_mine", { p_owner: user, p_post: id });
  return NextResponse.json({ mine: data ?? [] });
}
