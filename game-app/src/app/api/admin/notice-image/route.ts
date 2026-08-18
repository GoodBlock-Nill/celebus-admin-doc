import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { assertSameOrigin } from "@/lib/origin";

const BUCKET = "notice-images";
const MAX_BYTES = 3 * 1024 * 1024; // 3MB (버킷 제한과 동일)
const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

// 홈 팝업 공지 이미지 업로드 — 공개 버킷 저장 후 URL 반환(공지 저장은 별도 — image_url에 담김)
export async function POST(req: Request) {
  if (!assertSameOrigin(req) || !requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "bad_input" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "too_large" }, { status: 400 });
  const ext = EXT[file.type];
  if (!ext) return NextResponse.json({ error: "bad_type" }, { status: 400 });

  const db = admin();
  const path = `${randomUUID()}.${ext}`; // 파일마다 새 경로 — 교체 시 캐시 문제 없음
  const buf = Buffer.from(await file.arrayBuffer());
  const up = await db.storage.from(BUCKET).upload(path, buf, { contentType: file.type });
  if (up.error) return NextResponse.json({ error: "upload" }, { status: 500 });

  const url = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  return NextResponse.json({ status: "ok", url });
}
