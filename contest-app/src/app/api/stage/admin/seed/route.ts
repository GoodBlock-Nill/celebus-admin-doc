import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";
import { resolveStageUrl } from "@/lib/embed/resolve";

// 공식 콘텐츠 시드 (관리자 전용) — V01D 공식 유튜브 클립을 공연에 일괄 등록.
// 기존 인제스트(resolveStageUrl로 oembed 확보) 재사용 + stage_create_official RPC(공식 플래그, 레이트캡 없음).
// 인증: Authorization: Bearer <ADMIN_PASSWORD>
const schema = z.object({
  stage_id: z.string().uuid(),
  urls: z.array(z.string().url()).min(1).max(30),
  category: z.enum(["fancam", "cover", "edit", "etc", "v1de0", "oncam", "log", "azit", "stud10", "outv"]).default("v1de0"),
  handle: z.string().max(60).optional(), // 미지정 시 oembed 작성자 → 'V01D'
});

export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ code: "bad_input", error: parsed.error.issues[0]?.message }, { status: 400 });
  const { stage_id, urls, category, handle } = parsed.data;

  const results: { url: string; ok: boolean; id?: string; code?: string }[] = [];
  for (const url of urls) {
    const resolved = await resolveStageUrl(url);
    if (!resolved.ok) {
      results.push({ url, ok: false, code: resolved.code });
      continue;
    }
    const title = (resolved.oembed?.title ?? resolved.parsed.externalId).slice(0, 100);
    const finalHandle = (handle ?? resolved.authorHandle ?? "V01D").slice(0, 60);
    const { data, error } = await admin().rpc("stage_create_official", {
      p_stage: stage_id,
      p_platform: resolved.parsed.platform,
      p_source_url: resolved.parsed.canonicalUrl,
      p_external_id: resolved.parsed.externalId,
      p_oembed: resolved.oembed,
      p_title: title,
      p_description: "",
      p_handle: finalHandle,
      p_category: category,
    });
    if (error || !data) results.push({ url, ok: false, code: "server" });
    else if (["not_found", "closed", "duplicate"].includes(data as string)) results.push({ url, ok: false, code: data as string });
    else results.push({ url, ok: true, id: data as string });
  }
  const added = results.filter((r) => r.ok).length;
  return NextResponse.json({ added, total: urls.length, results });
}
