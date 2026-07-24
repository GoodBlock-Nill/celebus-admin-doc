import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { playerHash } from "@/lib/hash";
import { assertSameOrigin } from "@/lib/origin";
import { peekVoterId } from "@/lib/anon-identity";

// 자유 플레이 종료 시 사용 아이템 차감. 신원 없으면(플레이 이력 없음) no-op.
// 서버가 보유량으로 clamp → 과다 신고해도 음수 불가. 자유는 비랭킹이라 무결성 영향 없음.
const consumeSchema = z.object({
  used: z.record(z.enum(["bomb", "line", "shuffle", "time", "heart"]), z.number().int().min(0).max(999)), // heart = 일반 매치 이어하기
});

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });

  const parsed = consumeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });

  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json({ status: "ok", inventory: {} });

  const { data, error } = await admin().rpc("game_consume_items", {
    p_player_hash: playerHash(anonId),
    p_used: parsed.data.used,
  });
  if (error) return NextResponse.json({ error: "처리 중 오류가 발생했어요." }, { status: 500 });
  return NextResponse.json({ status: "ok", ...(data ?? { inventory: {} }) });
}
