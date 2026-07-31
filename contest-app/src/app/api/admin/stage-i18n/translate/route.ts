import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { isAdmin } from "@/lib/admin-auth";
import { assertSameOrigin } from "@/lib/origin";

// 아카이브·토너먼트 제목/설명 자동 번역 (저장 X — 폼이 결과를 받아 편집 후 저장).
// 한국어 base → EN·JA. K-pop 팬 플랫폼 톤 유지.
const schema = z.object({
  title: z.string().max(200).default(""),
  description: z.string().max(2000).default(""),
});

export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "자동 번역이 아직 준비되지 않았어요. (API 키 미설정)" }, { status: 503 });

  const src = parsed.data;
  if (!src.title.trim() && !src.description.trim()) {
    return NextResponse.json({ error: "번역할 한국어 내용을 먼저 입력해주세요." }, { status: 400 });
  }

  const localeSchema = {
    type: "object",
    properties: { title: { type: "string" }, description: { type: "string" } },
    required: ["title", "description"],
    additionalProperties: false,
  } as const;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system:
        "당신은 K-pop 팬 플랫폼 운영 문구 번역가입니다. 한국어 원문을 목표 언어로 자연스럽게 번역하세요. " +
        "친근하고 명확한 톤을 유지하고, 아티스트명·고유명사·해시태그는 원형을 유지합니다. 빈 필드는 빈 문자열로 두세요.",
      messages: [
        {
          role: "user",
          content: `다음 한국어를 영어(en)와 일본어(ja)로 번역해줘.\n\n제목: ${src.title}\n설명: ${src.description}`,
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: { en: localeSchema, ja: localeSchema },
            required: ["en", "ja"],
            additionalProperties: false,
          },
        },
      },
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("empty");
    const result = JSON.parse(textBlock.text) as {
      en: { title: string; description: string };
      ja: { title: string; description: string };
    };
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "번역 중 오류가 발생했어요. 잠시 후 다시 시도해주세요." }, { status: 502 });
  }
}
