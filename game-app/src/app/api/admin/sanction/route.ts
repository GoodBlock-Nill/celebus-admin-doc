import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { assertSameOrigin } from "@/lib/origin";

const schema = z.object({
  player_hash: z.string().regex(/^[a-f0-9]{16,64}$/),
  reset_nickname: z.boolean().default(false),
  reset_avatar: z.boolean().default(false),
});

// 제재 — 닉네임 초기화/아바타 제거(+업로드 이미지 스토리지 삭제)
export async function POST(req: Request) {
  if (!assertSameOrigin(req) || !requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_input" }, { status: 400 });
  const { player_hash, reset_nickname, reset_avatar } = parsed.data;

  const { data, error } = await admin().rpc("admin_sanction_profile", {
    p_h: player_hash,
    p_reset_nickname: reset_nickname,
    p_reset_avatar: reset_avatar,
  });
  if (error) return NextResponse.json({ error: "rpc" }, { status: 500 });
  if (data?.error) return NextResponse.json({ error: data.error }, { status: 400 });

  if (reset_avatar) {
    // 업로드 이미지 원본도 제거 (없어도 무해)
    await admin().storage.from("avatars").remove([`${player_hash}.jpg`]);
  }
  await logAdmin("sanction", player_hash, { reset_nickname, reset_avatar });
  return NextResponse.json({ status: "ok", ...data });
}
