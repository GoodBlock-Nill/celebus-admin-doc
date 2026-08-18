import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { playerHash } from "@/lib/hash";
import { assertSameOrigin } from "@/lib/origin";
import { peekVoterId } from "@/lib/anon-identity";

const schema = z.object({ season: z.string().regex(/^\d{4}-\d{2}$/) });

// CELEB PASS 보상 일괄 수령 — 서버가 도달 레벨·보상표(config) 재검증, 중복은 DB PK 차단
export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json({ status: "rejected", reason: "no_session" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ status: "rejected", reason: "bad_input" }, { status: 400 });

  const { data, error } = await admin().rpc("game_pass_claim_all", {
    p_h: playerHash(anonId),
    p_season: parsed.data.season,
  });
  if (error) return NextResponse.json({ status: "rejected", reason: "error" }, { status: 500 });
  if (data?.error) return NextResponse.json({ status: "rejected", reason: data.error }, { status: 400 });
  return NextResponse.json({ status: "ok", ...data });
}
