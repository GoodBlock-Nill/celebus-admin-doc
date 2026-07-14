import { NextResponse } from "next/server";
import { anon } from "@/lib/db-anon";
import { resolveUrlSchema } from "@/lib/schema";
import { resolveEntryUrl } from "@/lib/embed/resolve";
import { assertSameOrigin } from "@/lib/origin";
import type { ContestType } from "@/lib/types";

// 출품 1스텝: 링크 검증 + 미리보기 메타 + 중복 사전 체크
export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });

  const parsedBody = resolveUrlSchema.safeParse(await req.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "입력값을 확인해주세요." },
      { status: 400 },
    );
  }
  const { contest_id, url } = parsedBody.data;

  const db = anon();
  const { data: contest } = await db
    .from("contests_public")
    .select("id, contest_type, status")
    .eq("id", contest_id)
    .maybeSingle();
  if (!contest) return NextResponse.json({ error: "콘테스트를 찾을 수 없어요." }, { status: 404 });

  const result = await resolveEntryUrl(url, contest.contest_type as ContestType);
  if (!result.ok) {
    return NextResponse.json({ code: result.code }, { status: 422 });
  }

  const { count } = await db
    .from("contest_entries_public")
    .select("id", { count: "exact", head: true })
    .eq("contest_id", contest_id)
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
