import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { peekUserId } from "@/lib/identity";

// 내 신원·프로필 — SSO 로그인 상태 확인(게이트 판정) + 멤버 여부 + 닉네임.
export async function GET(req: Request) {
  const user = peekUserId(req);
  if (!user) return NextResponse.json({ signed_in: false, id: null, member: null, nickname: "" });
  const db = admin();
  const [{ data: member }, { data: profile }] = await Promise.all([
    db.from("stage_members").select("display_name, avatar_url").eq("user_id", user).maybeSingle(),
    db.from("stage_users").select("nickname, avatar_url").eq("user_id", user).maybeSingle(),
  ]);
  return NextResponse.json({
    signed_in: !!profile,
    id: user,
    member: member ?? null,
    nickname: profile?.nickname ?? "",
  });
}
