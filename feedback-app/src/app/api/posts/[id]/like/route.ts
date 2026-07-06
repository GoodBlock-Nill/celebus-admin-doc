import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { likeSchema } from "@/lib/schema";
import { hashWithSalt } from "@/lib/hash";
import { assertSameOrigin } from "@/lib/origin";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });
  const { id } = await params;
  const parsed = likeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });

  const { data: count, error } = await admin().rpc("like_post", {
    p_id: id,
    p_voter_hash: hashWithSalt(parsed.data.voter),
  });
  if (error) return NextResponse.json({ error: "처리 중 오류가 발생했어요." }, { status: 500 });
  return NextResponse.json({ like_count: count ?? 0 });
}
