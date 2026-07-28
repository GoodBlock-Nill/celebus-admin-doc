import { NextResponse } from "next/server";
import { z } from "zod";
import { anon } from "@/lib/db-anon";
import { resolveStageUrl } from "@/lib/embed/resolve";
import { assertSameOrigin } from "@/lib/origin";

const bodySchema = z.object({ stage_id: z.string().uuid(), url: z.string().trim().min(8).max(500) });

// 스테이지 업로드 1스텝: 링크 검증 + 미리보기 메타 + 중복 사전 체크 (전 플랫폼 허용)
export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ code: "forbidden" }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ code: "bad_input" }, { status: 400 });

  const result = await resolveStageUrl(parsed.data.url);
  if (!result.ok) return NextResponse.json({ code: result.code }, { status: 422 });

  const { count } = await anon()
    .from("stage_posts_public")
    .select("id", { count: "exact", head: true })
    .eq("stage_id", parsed.data.stage_id)
    .eq("platform", result.parsed.platform)
    .eq("external_id", result.parsed.externalId);

  return NextResponse.json({
    platform: result.parsed.platform,
    externalId: result.parsed.externalId,
    canonicalUrl: result.parsed.canonicalUrl,
    oembed: result.oembed,
    authorHandle: result.authorHandle,
    duplicate: (count ?? 0) > 0,
  });
}
