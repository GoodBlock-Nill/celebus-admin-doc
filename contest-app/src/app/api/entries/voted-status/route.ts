import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { voterHash } from "@/lib/hash";
import { assertSameOrigin } from "@/lib/origin";
import { peekVoterId } from "@/lib/anon-identity";

// 현재 쿠키 신원이 이미 투표한 출품작 ID 목록 반환 — 하트 버튼 상태를 서버 기준으로 동기화.
const schema = z.object({ ids: z.array(z.string().uuid()).max(300) });

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ voted: [] }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || parsed.data.ids.length === 0) return NextResponse.json({ voted: [] });

  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json({ voted: [] }); // 쿠키 없음 = 아직 투표 안 함

  const { data } = await admin()
    .from("contest_votes")
    .select("entry_id")
    .eq("voter_hash", voterHash(anonId))
    .in("entry_id", parsed.data.ids);

  return NextResponse.json({ voted: (data ?? []).map((r) => r.entry_id as string) });
}
