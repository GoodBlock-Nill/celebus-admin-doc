import 'server-only';

// 신고 증빙 이미지 공통 규격 — 업로드 라우트와 관리자 조회 라우트가 함께 쓴다.
import { admin } from './db-admin';

/** 비공개 보관함 — 정책이 없어 서버(service_role)로만 읽고 쓸 수 있다. */
export const EVIDENCE_BUCKET = 'ticket-report-evidence';

const BYTES_PER_MB = 1024 * 1024;

/** 파일당 용량 상한 */
export const EVIDENCE_MAX_BYTES = 5 * BYTES_PER_MB;

/** 신고 1건에 첨부할 수 있는 장수 */
export const EVIDENCE_MAX_COUNT = 3;

/** 관리자 열람 주소 유효 시간 (초) — 화면을 열어 둔 동안만 쓰이도록 짧게 유지한다. */
export const EVIDENCE_SIGNED_URL_SECONDS = 60 * 60;

export const EVIDENCE_FORMAT_REASON = '증빙 이미지는 JPG · PNG · WEBP 파일만 첨부할 수 있습니다.';
export const EVIDENCE_SIZE_REASON = '증빙 이미지는 한 장당 5MB 이하만 첨부할 수 있습니다.';

/** 형식별 허용 확장자 — 실제 형식과 파일명이 모두 맞아야 통과시킨다. */
const ALLOWED: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
};

/** 허용 형식이면 저장에 쓸 확장자, 아니면 null */
export function evidenceExtension(file: File): string | null {
  const allowedExtensions = ALLOWED[file.type];
  if (!allowedExtensions) return null;

  const dot = file.name.lastIndexOf('.');
  const extension = dot < 0 ? '' : file.name.slice(dot + 1).toLowerCase();
  return allowedExtensions.includes(extension) ? extension : null;
}

/**
 * 저장 경로 → 한시적 열람 주소.
 * 비공개 보관함이라 이 주소 외에는 어떤 경로로도 이미지를 열 수 없다.
 * 만들지 못한 경로는 목록에서 빠진다(삭제된 파일 등).
 */
export async function signEvidencePaths(paths: string[]): Promise<Map<string, string>> {
  const signed = new Map<string, string>();
  if (paths.length === 0) return signed;

  const { data } = await admin()
    .storage.from(EVIDENCE_BUCKET)
    .createSignedUrls(paths, EVIDENCE_SIGNED_URL_SECONDS);

  for (const item of data ?? []) {
    if (item.path && item.signedUrl) signed.set(item.path, item.signedUrl);
  }
  return signed;
}
