import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { anon } from "@/lib/db-anon";
import { voteSchema } from "@/lib/schema";
import { voterHash, getClientIp } from "@/lib/hash";
import { assertSameOrigin } from "@/lib/origin";
import { voteThrottled } from "@/lib/ratelimit";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }
  const parsed = voteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });

  const ip = getClientIp(req);
  // IP 총량 스로틀 — 한 IP에서 무한 새 디바이스ID로 득표 부풀리는 조작 차단
  if (voteThrottled(ip)) {
    return NextResponse.json({ status: "limit", vote_count: null });
  }

  // voter_hash = 디바이스ID + 서버 신뢰 IP 결합 (같은 기기 중복 방지)
  const { data: status, error } = await admin().rpc("contest_vote", {
    p_entry_id: id,
    p_voter_hash: voterHash(parsed.data.voter, ip),
  });
  if (error) return NextResponse.json({ error: "처리 중 오류가 발생했어요." }, { status: 500 });

  let voteCount: number | null = null;
  if (status === "ok") {
    const { data } = await anon().from("contest_entries_public").select("vote_count").eq("id", id).maybeSingle();
    voteCount = data?.vote_count ?? null;
  }
  return NextResponse.json({ status, vote_count: voteCount });
}
