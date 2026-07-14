import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { admin } from "@/lib/db-admin";
import { translateSchema } from "@/lib/schema";
import { assertSameOrigin } from "@/lib/origin";

type Ctx = { params: Promise<{ id: string }> };

const LANG_NAME: Record<string, string> = { ko: "한국어", en: "English", ja: "日本語" };

// 팬 게시글 번역 — 반말·이모지·팬덤 슬랭 뉘앙스를 살려 자연스럽게. 캐시 우선.
export async function POST(req: Request, { params }: Ctx) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });
  const { id } = await params;
  const parsed = translateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  const { lang } = parsed.data;

  // 원문 + 캐시 조회
  const { data: post } = await admin()
    .from("posts")
    .select("title, body, translations")
    .eq("id", id)
    .eq("hidden", false)
    .maybeSingle();
  if (!post) return NextResponse.json({ error: "게시글을 찾을 수 없어요." }, { status: 404 });

  // 캐시 적중 → 즉시 반환 (0비용)
  const cached = (post.translations as Record<string, { title: string; body: string }> | null)?.[lang];
  if (cached) return NextResponse.json({ ...cached, cached: true });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "번역 기능이 아직 준비되지 않았어요." }, { status: 503 });

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system:
        "당신은 K-pop 팬 커뮤니티 게시글 번역가입니다. 팬이 쓴 글을 목표 언어로 자연스럽게 번역하세요. " +
        "반말·이모지·팬덤 슬랭·밈·감탄사의 뉘앙스와 감정을 그대로 살리고, 직역투를 피합니다. " +
        "아티스트명·고유명사·해시태그는 원형을 유지합니다. 이미 목표 언어로 쓰인 부분은 그대로 둡니다. " +
        '반드시 JSON만 출력: {"title": "...", "body": "..."}. 제목이 비어 있으면 빈 문자열.',
      messages: [
        {
          role: "user",
          content:
            `목표 언어: ${LANG_NAME[lang]}\n\n` +
            `제목: ${post.title ?? ""}\n본문: ${post.body}`,
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: { title: { type: "string" }, body: { type: "string" } },
            required: ["title", "body"],
            additionalProperties: false,
          },
        },
      },
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("empty");
    const result = JSON.parse(textBlock.text) as { title: string; body: string };

    // 캐시 저장 (실패해도 번역 결과는 반환)
    await admin().rpc("cache_translation", { p_id: id, p_lang: lang, p_value: result });

    return NextResponse.json({ ...result, cached: false });
  } catch {
    return NextResponse.json({ error: "번역 중 오류가 발생했어요. 잠시 후 다시 시도해주세요." }, { status: 502 });
  }
}
