import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { assertSameOrigin } from "@/lib/origin";

const BUCKET = "member-avatars";
const MAX_BYTES = 3 * 1024 * 1024; // 3MB
const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

// V01D 멤버 아바타 이미지 업로드 — 파일을 공개 버킷에 저장하고 URL을 member_avatar에 기록.
// CELEBUS 프로필 이미지가 있으면 그쪽이 우선이라 이 이미지는 프로필 이미지가 없을 때만 노출됨.
export async function POST(req: Request) {
  if (!assertSameOrigin(req) || !requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const hash = String(form?.get("player_hash") ?? "");
  const file = form?.get("file");
  if (!/^[a-f0-9]{16,64}$/.test(hash) || !(file instanceof File)) return NextResponse.json({ error: "bad_input" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "too_large" }, { status: 400 });
  const ext = EXT[file.type];
  if (!ext) return NextResponse.json({ error: "bad_type" }, { status: 400 });

  const db = admin();
  const path = `${hash}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const up = await db.storage.from(BUCKET).upload(path, buf, { contentType: file.type, upsert: true });
  if (up.error) return NextResponse.json({ error: "upload" }, { status: 500 });

  // 캐시 무력화용 버전 쿼리 — 같은 경로에 덮어써도 즉시 갱신되도록
  const base = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const url = `${base}?v=${buf.length}`;

  const { data, error } = await db.rpc("admin_set_member_avatar", { p_h: hash, p_url: url });
  if (error) return NextResponse.json({ error: "rpc" }, { status: 500 });
  if (data?.error) return NextResponse.json({ error: data.error }, { status: 400 });

  await logAdmin("set_member_avatar", hash, { path });
  return NextResponse.json({ status: "ok", url });
}

// 아바타 이미지 제거 → 기존 아바타/기본으로 복귀
export async function DELETE(req: Request) {
  if (!assertSameOrigin(req) || !requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const hash = new URL(req.url).searchParams.get("h") ?? "";
  if (!/^[a-f0-9]{16,64}$/.test(hash)) return NextResponse.json({ error: "bad_input" }, { status: 400 });

  const db = admin();
  await db.storage.from(BUCKET).remove([`${hash}.png`, `${hash}.jpg`, `${hash}.webp`]);
  const { error } = await db.rpc("admin_set_member_avatar", { p_h: hash, p_url: "" });
  if (error) return NextResponse.json({ error: "rpc" }, { status: 500 });

  await logAdmin("clear_member_avatar", hash, {});
  return NextResponse.json({ status: "ok" });
}
