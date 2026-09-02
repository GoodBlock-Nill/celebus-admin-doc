'use client';

import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

import { CloseIcon, ImageIcon, LinkIcon } from '../_components/icons';
import { INPUT, MUTED } from '../_components/ui';
import {
  EVIDENCE_ACCEPT,
  EVIDENCE_MAX_COUNT,
  type EvidenceAttachment,
} from './use-evidence-upload';

const ADD_BUTTON =
  'flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-[#E5E8EB] bg-white text-[14.5px] font-semibold text-[#191F28] disabled:text-[#B0B8C1]';

interface EvidenceFieldProps {
  evidenceUrl: string;
  onEvidenceUrlChange: (value: string) => void;
  attachments: EvidenceAttachment[];
  isUploading: boolean;
  uploadError: string;
  onAttach: (file: File) => void;
  onRemove: (path: string) => void;
}

/**
 * STEP 3 증거 자료 — 링크와 이미지 첨부 두 가지 방법을 나란히 제공한다.
 * 이미지는 고른 즉시 서버 보관함에 올라가고, 화면에는 브라우저 안에서 만든 미리보기를 보여 준다.
 */
export function EvidenceField({
  evidenceUrl,
  onEvidenceUrlChange,
  attachments,
  isUploading,
  uploadError,
  onAttach,
  onRemove,
}: EvidenceFieldProps) {
  const [showsLinkInput, setShowsLinkInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFull = attachments.length >= EVIDENCE_MAX_COUNT;

  const handleSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // 같은 파일을 다시 고를 수 있도록 선택 값을 비운다.
    event.target.value = '';
    if (file) onAttach(file);
  };

  return (
    <div>
      <p className="mb-1.5 text-[13.5px] font-semibold text-[#191F28]">
        증거 자료 <span className={`font-medium ${MUTED}`}>(선택)</span>
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowsLinkInput((value) => !value)}
          aria-expanded={showsLinkInput}
          className={ADD_BUTTON}
        >
          <LinkIcon className="h-4.5 w-4.5 text-[#4E5968]" />
          링크 추가
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isFull}
          className={ADD_BUTTON}
        >
          <ImageIcon className="h-4.5 w-4.5 text-[#4E5968]" />
          {isUploading ? '올리는 중…' : '파일 첨부'}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={EVIDENCE_ACCEPT}
        aria-label="증빙 이미지 선택"
        className="hidden"
        onChange={handleSelect}
      />

      {showsLinkInput ? (
        <div className="mt-2.5">
          <input
            value={evidenceUrl}
            inputMode="url"
            placeholder="https://"
            aria-label="증거 링크"
            onChange={(event) => onEvidenceUrlChange(event.target.value)}
            className={INPUT}
          />
          <p className={`mt-1.5 text-[12.5px] ${MUTED}`}>
            게시물 주소나 대화 캡처를 올려둔 주소를 입력해 주세요.
          </p>
        </div>
      ) : null}

      {attachments.length > 0 ? (
        <ul className="mt-2.5 flex flex-wrap gap-2">
          {attachments.map((item) => (
            <li key={item.path} className="relative">
              <img
                src={item.previewUrl}
                alt={`첨부한 증빙 이미지 ${item.fileName}`}
                className="h-20 w-20 rounded-xl border border-[#E5E8EB] object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(item.path)}
                aria-label={`${item.fileName} 첨부 삭제`}
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-[#E5E8EB] bg-white text-[#4E5968] shadow-[0_1px_3px_rgba(25,31,40,0.12)]"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {uploadError ? (
        <p className="mt-1.5 text-[12.5px] font-medium text-[#D92D20]">{uploadError}</p>
      ) : (
        <p className={`mt-1.5 text-[12.5px] ${MUTED}`}>
          이미지는 최대 {EVIDENCE_MAX_COUNT}장, 한 장당 5MB까지 첨부할 수 있어요 (JPG · PNG · WEBP).
        </p>
      )}
    </div>
  );
}
