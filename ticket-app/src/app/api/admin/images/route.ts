import { randomUUID } from 'crypto';

import { isGuardFailure, requireAdmin } from '@/lib/server/admin-api';
import { HTTP_STATUS, fail, guardMutation, ok } from '@/lib/server/api';
import { admin } from '@/lib/server/db-admin';
import type { AdminImageKind } from '@/lib/admin-types';

/** 공개 읽기 보관함 — 쓰기는 이 라우트(service_role)로만 이뤄진다. */
const BUCKET = 'ticket-images';

const BYTES_PER_MB = 1024 * 1024;

interface ImageRule {
  /** 보관함 안 폴더 */
  folder: string;
  maxBytes: number;
  /** 오류 문구에 쓰는 용도 이름 */
  label: string;
  /** 오류 문구에 쓰는 용량 상한 표기 */
  maxLabel: string;
}

const IMAGE_RULES: Record<AdminImageKind, ImageRule> = {
  poster: { folder: 'concert-posters', maxBytes: 5 * BYTES_PER_MB, label: '포스터 이미지', maxLabel: '5MB' },
  detail: { folder: 'concert-details', maxBytes: 2 * BYTES_PER_MB, label: '상세 이미지', maxLabel: '2MB' },
};

/** 허용 형식 — 목록·상세 어디서나 열리는 두 형식만 받는다. */
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png'];
const FORMAT_REASON = '이미지는 JPG 또는 PNG 파일만 등록할 수 있습니다.';

function isImageKind(value: unknown): value is AdminImageKind {
  return value === 'poster' || value === 'detail';
}

/** 파일명 끝의 확장자만 소문자로 뽑는다 (없으면 빈 문자열) */
function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot < 0 ? '' : fileName.slice(dot + 1).toLowerCase();
}

/** 이미지 업로드 — 포스터·상세 이미지를 공개 보관함에 올리고 공개 주소를 돌려준다. */
export async function POST(req: Request) {
  const blocked = guardMutation(req, 'admin-image');
  if (blocked) return blocked;

  const guard = requireAdmin(req);
  if (isGuardFailure(guard)) return guard;

  const form = await req.formData().catch(() => null);
  if (!form) return fail('이미지 정보를 읽지 못했습니다. 다시 시도해 주세요.', HTTP_STATUS.badRequest);

  const kind = form.get('kind');
  if (!isImageKind(kind)) return fail('이미지 용도를 확인해 주세요.', HTTP_STATUS.badRequest);

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return fail('업로드할 이미지를 선택해 주세요.', HTTP_STATUS.badRequest);
  }

  const rule = IMAGE_RULES[kind];
  const extension = extensionOf(file.name);
  if (!ALLOWED_TYPES.includes(file.type) || !ALLOWED_EXTENSIONS.includes(extension)) {
    return fail(FORMAT_REASON, HTTP_STATUS.badRequest);
  }
  if (file.size > rule.maxBytes) {
    return fail(`${rule.label}는 ${rule.maxLabel} 이하만 등록할 수 있습니다.`, HTTP_STATUS.badRequest);
  }

  // 파일명은 난수로 새로 만든다 — 원본 파일명에 담긴 정보가 공개 주소로 새지 않게 한다.
  const path = `${rule.folder}/${randomUUID()}.${extension}`;
  const client = admin();
  const uploaded = await client.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploaded.error) {
    return fail('이미지를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.', HTTP_STATUS.serverError);
  }

  const { publicUrl } = client.storage.from(BUCKET).getPublicUrl(path).data;
  return ok({ url: publicUrl });
}
