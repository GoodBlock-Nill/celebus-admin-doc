import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { isAdmin } from "@/lib/admin-auth";
import { assertSameOrigin } from "@/lib/origin";
import { contestTranslateSchema } from "@/lib/schema";

// 콘테스트 본문 자동 번역 제안 (저장 X — 폼이 결과를 받아 편집 후 저장).
// 한국어 base → EN·JA. K-pop 팬 콘테스트 톤 유지.
export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });

  const parsed = contestTranslateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "자동 번역이 아직 준비되지 않았어요. (API 키 미설정)" }, { status: 503 });

  const src = parsed.data;
  const hasPrizes = src.prizes.some((p) => p.name.trim() || p.rank_label.trim());
  if (!src.title.trim() && !src.description.trim() && !src.rules.trim() && !src.prize_summary.trim() && !hasPrizes) {
    return NextResponse.json({ error: "번역할 한국어 내용을 먼저 입력해주세요." }, { status: 400 });
  }

  // 보상 항목 스키마 — base와 같은 순서·개수로 반환 강제
  const prizesSchema = {
    type: "array",
    items: {
      type: "object",
      properties: { name: { type: "string" }, rank_label: { type: "string" } },
      required: ["name", "rank_label"],
      additionalProperties: false,
    },
  } as const;
  const localeSchema = {
    type: "object",
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      rules: { type: "string" },
      prize_summary: { type: "string" },
      prizes: prizesSchema,
    },
    required: ["title", "description", "rules", "prize_summary", "prizes"],
    additionalProperties: false,
  } as const;

  const prizeLines = src.prizes.map((p, i) => `  ${i + 1}. 순위: ${p.rank_label} / 보상: ${p.name}`).join("\n");

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      system:
        "당신은 K-pop 팬 콘테스트 운영 문구 번역가입니다. 한국어 원문을 목표 언어로 자연스럽게 번역하세요. " +
        "콘테스트 안내 톤(친근하고 명확하게)을 유지하고, 아티스트명·고유명사·해시태그는 원형을 유지합니다. " +
        "빈 필드는 빈 문자열로 두세요. 각 언어별로 {title, description, rules, prize_summary} 4개 필드와 prizes 배열을 채웁니다. " +
        "prizes는 입력과 같은 순서·개수로 각 항목의 name(보상 이름)·rank_label(순위 라벨)만 번역합니다. " +
        "순위 라벨의 숫자·구간(예: 1~5위)은 유지합니다.",
      messages: [
        {
          role: "user",
          content:
            "다음 한국어 콘테스트 내용을 영어(en)와 일본어(ja)로 번역해줘.\n\n" +
            `제목: ${src.title}\n소개: ${src.description}\n참가 규정: ${src.rules}\n보상 요약: ${src.prize_summary}\n` +
            (prizeLines ? `보상 항목(순서 유지):\n${prizeLines}` : "보상 항목: 없음"),
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
      en: Record<string, unknown>;
      ja: Record<string, unknown>;
    };
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "번역 중 오류가 발생했어요. 잠시 후 다시 시도해주세요." }, { status: 502 });
  }
}
