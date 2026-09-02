import { randomUUID } from 'crypto';

import { HTTP_STATUS, fail, guardMutation, isResponse, ok, requireMember } from '@/lib/server/api';
import { admin } from '@/lib/server/db-admin';
import {
  EVIDENCE_BUCKET,
  EVIDENCE_FORMAT_REASON,
  EVIDENCE_MAX_BYTES,
  EVIDENCE_SIZE_REASON,
  evidenceExtension,
} from '@/lib/server/report-evidence';

/** 저장 경로 앞머리 — 연월 폴더로 나눠 두면 보관 기간이 지난 자료를 한 번에 정리할 수 있다. */
function monthFolder(now: Date): string {
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  return `${year}${month}`;
}

/**
 * 신고 증빙 이미지 업로드 — 로그인 회원만, 한 번에 1장씩 비공개 보관함에 올린다.
 * 회원이 보관함에 직접 쓰지 않고 서버가 대신 저장하며, 응답에는 저장 경로만 담는다
 * (공개 주소가 없는 비공개 보관함이라 경로를 알아도 열 수 없다).
 *
 * 접수까지 이어지지 않은 업로드 파일은 그대로 남는다 — 시범 운영 단계에서는 허용하고,
 * 보관 기간이 지난 연월 폴더를 일괄 정리하는 방식으로 뒤에 다룬다.
 */
export async function POST(req: Request) {
  const blocked = guardMutation(req, 'report-evidence');
  if (blocked) return blocked;

  const member = await requireMember(req);
  if (isResponse(member)) return member;

  const form = await req.formData().catch(() => null);
  if (!form) return fail('파일 정보를 읽지 못했습니다. 다시 시도해 주세요.', HTTP_STATUS.badRequest);

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return fail('첨부할 이미지를 선택해 주세요.', HTTP_STATUS.badRequest);
  }

  const extension = evidenceExtension(file);
  if (!extension) return fail(EVIDENCE_FORMAT_REASON, HTTP_STATUS.badRequest);
  if (file.size > EVIDENCE_MAX_BYTES) return fail(EVIDENCE_SIZE_REASON, HTTP_STATUS.badRequest);

  // 원본 파일명에 담긴 정보가 남지 않도록 저장 이름은 난수로 새로 만든다.
  const path = `${monthFolder(new Date())}/${randomUUID()}.${extension}`;
  const uploaded = await admin()
    .storage.from(EVIDENCE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploaded.error) {
    return fail('이미지를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.', HTTP_STATUS.serverError);
  }

  return ok({ path });
}
