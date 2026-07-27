import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { assertSameOrigin } from "@/lib/origin";

const schema = z.object({
  player_hash: z.string().regex(/^[a-f0-9]{16,64}$/),
  name_ko: z.string().max(40),
  name_en: z.string().max(40),
  name_ja: z.string().max(40),
});

// V01D 멤버 표시 이름 저장 — 닉네임은 유지, 이 이름은 닉네임 옆에 다국어(ko/en/ja)로 병기됨.
export async function POST(req: Request) {
  if (!assertSameOrigin(req) || !requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_input" }, { status: 400 });

  const { player_hash, name_ko, name_en, name_ja } = parsed.data;
  const { data, error } = await admin().rpc("admin_set_member_names", {
    p_h: player_hash,
    p_ko: name_ko.trim(),
    p_en: name_en.trim(),
    p_ja: name_ja.trim(),
  });
  if (error) return NextResponse.json({ error: "rpc" }, { status: 500 });
  if (data?.error) return NextResponse.json({ error: data.error }, { status: 400 });

  await logAdmin("set_member_names", player_hash, { ko: name_ko.trim(), en: name_en.trim(), ja: name_ja.trim() });
  return NextResponse.json({ status: "ok" });
}
