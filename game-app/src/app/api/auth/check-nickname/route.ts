import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";

const NICK_RE = /^[a-z0-9._-]{3,20}$/;

// 가입 폼 닉네임 중복 사전 확인 (제출 전 안내용 — 최종 판정은 game_signup이 담당)
export async function GET(req: Request) {
  const n = new URL(req.url).searchParams.get("n") ?? "";
  if (!NICK_RE.test(n)) return NextResponse.json({ available: false, reason: "bad_nickname" });

  const { data, error } = await admin().from("game_profiles").select("player_hash").ilike("nickname", n).limit(1);
  if (error) return NextResponse.json({ available: null }); // 판정 불가 — 클라이언트는 표시 생략
  return NextResponse.json({ available: !data || data.length === 0 });
}
