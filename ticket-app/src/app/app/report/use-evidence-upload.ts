'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { api } from '@/lib/api-client';

/** 신고 1건에 첨부할 수 있는 장수 (서버에서도 같은 값으로 다시 확인한다) */
export const EVIDENCE_MAX_COUNT = 3;

const BYTES_PER_MB = 1024 * 1024;
const MAX_BYTES = 5 * BYTES_PER_MB;

/** 화면 파일 선택창에 걸어 두는 형식 */
export const EVIDENCE_ACCEPT = 'image/jpeg,image/png,image/webp';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const FORMAT_REASON = '증빙 이미지는 JPG · PNG · WEBP 파일만 첨부할 수 있습니다.';
const SIZE_REASON = '증빙 이미지는 한 장당 5MB 이하만 첨부할 수 있습니다.';
const COUNT_REASON = `증빙 이미지는 최대 ${EVIDENCE_MAX_COUNT}장까지 첨부할 수 있습니다.`;

/** 첨부한 증빙 한 장 — 미리보기는 브라우저 안에서만 만들고, 접수에는 저장 경로만 보낸다. */
export interface EvidenceAttachment {
  path: string;
  fileName: string;
  previewUrl: string;
}

/**
 * 증빙 이미지 첨부 상태 관리.
 * 선택 즉시 서버로 올려 저장 경로를 받아 두고, 접수 시에는 경로만 함께 보낸다.
 */
export function useEvidenceUpload() {
  const [attachments, setAttachments] = useState<EvidenceAttachment[]>([]);
  const [isUploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 최신 목록 사본 — 장수 확인과 화면을 떠날 때의 미리보기 주소 정리에 쓴다.
  const latest = useRef<EvidenceAttachment[]>([]);
  latest.current = attachments;
  useEffect(
    () => () => {
      for (const item of latest.current) URL.revokeObjectURL(item.previewUrl);
    },
    [],
  );

  const attach = useCallback(async (file: File) => {
    setErrorMessage('');

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMessage(FORMAT_REASON);
      return;
    }
    if (file.size > MAX_BYTES) {
      setErrorMessage(SIZE_REASON);
      return;
    }

    // 장수는 화면에 그려진 최신 목록으로 본다 — 상한을 넘으면 올리지 않고 바로 알린다.
    if (latest.current.length >= EVIDENCE_MAX_COUNT) {
      setErrorMessage(COUNT_REASON);
      return;
    }

    setUploading(true);
    const result = await api.uploadReportEvidence(file);
    setUploading(false);

    if (!result.ok) {
      setErrorMessage(result.reason);
      return;
    }
    const added: EvidenceAttachment = {
      path: result.data.path,
      fileName: file.name,
      previewUrl: URL.createObjectURL(file),
    };
    setAttachments((current) =>
      current.length >= EVIDENCE_MAX_COUNT ? current : [...current, added],
    );
  }, []);

  const remove = useCallback((path: string) => {
    setErrorMessage('');
    setAttachments((current) => {
      const target = current.find((item) => item.path === path);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((item) => item.path !== path);
    });
  }, []);

  return { attachments, isUploading, errorMessage, attach, remove };
}
