import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { playerHash } from "@/lib/hash";
import { assertSameOrigin } from "@/lib/origin";
import { peekVoterId } from "@/lib/anon-identity";

// dataURL 상한 ≈ 1.5MB 원본 (256px JPEG는 보통 수십 KB — 여유 상한)
const MAX_IMAGE_CHARS = 2_000_000;

const schema = z
  .object({
    avatar: z.string().trim().min(1).max(200).optional(), // 기본 아바타 id
    image: z.string().max(MAX_IMAGE_CHARS).optional(), // 업로드 이미지 dataURL(JPEG/PNG)
  })
  .refine((v) => !!v.avatar || !!v.image, { message: "empty" });

// 아바타 변경 — 기본 아바타 id 저장 또는 이미지 업로드(스토리지) 후 URL 저장
export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });

  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json({ status: "rejected", reason: "not_signed_up" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ status: "rejected", reason: "bad_input" }, { status: 400 });

  const hash = playerHash(anonId);
  let value = parsed.data.avatar ?? "";

  if (parsed.data.image) {
    const m = parsed.data.image.match(/^data:image\/(jpeg|png);base64,(.+)$/);
    if (!m) return NextResponse.json({ status: "rejected", reason: "bad_image" }, { status: 400 });
    const buf = Buffer.from(m[2], "base64");
    const path = `${hash}.jpg`;
    const { error: upErr } = await admin()
      .storage.from("avatars")
      .upload(path, buf, { contentType: `image/${m[1]}`, upsert: true });
    if (upErr) return NextResponse.json({ status: "rejected", reason: "upload_failed" }, { status: 500 });
    const { data: pub } = admin().storage.from("avatars").getPublicUrl(path);
    // 동일 경로 재업로드 캐시 무효화를 위해 버전 쿼리 부여
    value = `${pub.publicUrl}?v=${Date.now()}`;
  }

  const { data: result, error } = await admin().rpc("game_set_avatar", { p_player_hash: hash, p_avatar: value });
  if (error) return NextResponse.json({ status: "rejected", reason: "error" }, { status: 500 });
  if (result?.error) return NextResponse.json({ status: "rejected", reason: result.error }, { status: 401 });

  return NextResponse.json({ status: "ok", avatar: value });
}
