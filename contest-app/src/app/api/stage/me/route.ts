import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { getUserId, setIdentityCookie } from "@/lib/identity";

// 내 신원 확인 — 멤버 여부(멤버 전용 UI 노출용) + 내 식별자(개발 기간 멤버 등록용).
// W4 SSO 전환 시 이 라우트가 SSO 프로필(닉네임 등)을 반환하게 확장된다.
export async function GET(req: Request) {
  const user = getUserId(req);
  const { data } = await admin().from("stage_members").select("display_name, avatar_url").eq("user_id", user.id).maybeSingle();
  const res = NextResponse.json({ id: user.id, member: data ?? null });
  if (user.isNew) setIdentityCookie(res.headers, user.id);
  return res;
}
