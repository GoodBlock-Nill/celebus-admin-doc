import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { assertSameOrigin } from "@/lib/origin";
import { peekUserId } from "@/lib/identity";

// 내 알림 목록 + 미읽음 수
export async function GET(req: Request) {
  const user = peekUserId(req);
  if (!user) return NextResponse.json({ unread: 0, items: [] });
  const { data, error } = await admin().rpc("notifications_list", { p_user: user });
  if (error || !data) return NextResponse.json({ unread: 0, items: [] });
  return NextResponse.json(data);
}

// 전체 읽음 처리
export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ code: "forbidden" }, { status: 403 });
  const user = peekUserId(req);
  if (!user) return NextResponse.json({ ok: true });
  await admin().rpc("notifications_read_all", { p_user: user });
  return NextResponse.json({ ok: true });
}
