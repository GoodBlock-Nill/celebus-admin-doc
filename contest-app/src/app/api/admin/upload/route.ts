import { NextResponse } from "next/server";
import sharp from "sharp";
import { admin } from "@/lib/db-admin";
import { isAdmin } from "@/lib/admin-auth";
import { assertSameOrigin } from "@/lib/origin";

const BUCKET = "contest-media";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB (입력 상한)
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};
// 폴더별 리사이즈 상한(가로 px) — 저장·전송 용량 최소화
const MAX_WIDTH: Record<string, number> = { cover: 1600, prize: 1200 };

// 관리자 이미지 업로드 — 커버·상품·아바타 이미지.
// 업로드 시 서버에서 리사이즈 + WebP 변환(품질 82)으로 압축해 앱 전송 용량을 크게 줄인다.
// GIF(애니메이션)는 프레임 손실 방지를 위해 원본 유지.
export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "파일이 없어요." }, { status: 400 });

  const ext = ALLOWED[file.type];
  if (!ext) return NextResponse.json({ error: "JPEG·PNG·GIF·WebP 이미지만 올릴 수 있어요." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "이미지는 5MB 이하여야 해요." }, { status: 400 });

  const folder = (form?.get("folder") as string) === "prize" ? "prize" : "cover";
  const input = Buffer.from(await file.arrayBuffer());

  // 압축·리사이즈(GIF 제외). 실패 시 원본으로 폴백.
  let outBytes: Buffer | Uint8Array = input;
  let outExt = ext;
  let outType = file.type;
  if (file.type !== "image/gif") {
    try {
      outBytes = await sharp(input)
        .rotate() // EXIF 방향 보정
        .resize({ width: MAX_WIDTH[folder], withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      outExt = "webp";
      outType = "image/webp";
    } catch {
      /* 변환 실패 시 원본 업로드로 폴백 */
    }
  }

  const rand = Math.random().toString(36).slice(2, 10);
  const path = `${folder}/${Date.now()}-${rand}.${outExt}`;

  const db = admin();
  const { error } = await db.storage.from(BUCKET).upload(path, outBytes, { contentType: outType, upsert: false });
  if (error) return NextResponse.json({ error: "업로드 실패" }, { status: 500 });

  const { data } = db.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
