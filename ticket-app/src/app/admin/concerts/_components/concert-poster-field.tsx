'use client';

import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

import { Button } from '../../_components/form';
import { useToast } from '../../_components/toast';
import { POSTER_GUIDE, checkPosterSize, readImageSize } from './concert-image-rules';
import { ConcertImageGuide, MediaField } from './concert-media-ui';
import { adminApi } from '@/lib/admin-client';

const ACCEPT = 'image/jpeg,image/png';
const READ_FAILURE = '이미지를 읽지 못했습니다. 다른 파일로 다시 시도해 주세요.';

interface PosterFieldProps {
  posterUrl: string;
  error?: string;
  onChange: (posterUrl: string) => void;
}

/** 포스터 이미지 등록 — 3:4 세로형 대표 이미지(필수). 최소 크기 미달은 등록 전에 막는다. */
export function ConcertPosterField({ posterUrl, error, onChange }: PosterFieldProps) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  /** 권장 비율과 달라도 등록은 허용하므로, 주의 문구만 남겨 둔다. */
  const [warning, setWarning] = useState('');

  const handleSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // 같은 파일을 다시 고를 수 있도록 선택 값을 비운다.
    event.target.value = '';
    if (!file) return;

    setWarning('');

    const size = await readImageSize(file);
    if (!size) {
      toast.error(READ_FAILURE);
      return;
    }

    const check = checkPosterSize(size);
    if (check.error) {
      toast.error(check.error);
      return;
    }

    setUploading(true);
    const result = await adminApi.uploadImage(file, 'poster');
    setUploading(false);

    if (!result.ok) {
      toast.error(result.reason);
      return;
    }

    onChange(result.data.url);
    if (check.warning) {
      setWarning(check.warning);
      toast.info(check.warning);
      return;
    }
    toast.success('포스터 이미지를 등록했습니다.');
  };

  const handleRemove = () => {
    onChange('');
    setWarning('');
  };

  return (
    <MediaField label="포스터 이미지" required error={error}>
      <div className="flex flex-col gap-3">
        <ConcertImageGuide lines={POSTER_GUIDE} />

        <div className="flex items-start gap-3">
          {posterUrl ? (
            // 목록·상세와 같은 3:4 비율로 잘라 보여 준다.
            <img
              src={posterUrl}
              alt="등록한 포스터 미리보기"
              className="aspect-[3/4] w-[132px] shrink-0 rounded-lg border border-[#E3E5EA] object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex aspect-[3/4] w-[132px] shrink-0 items-center justify-center rounded-lg border border-dashed border-[#C9CDD6] bg-[#FAFBFC] px-2 text-center text-[12px] leading-relaxed text-[#6B7080]">
              포스터 없음
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? '업로드 중…' : posterUrl ? '이미지 교체' : '이미지 선택'}
            </Button>
            {posterUrl ? (
              <Button variant="danger" onClick={handleRemove} disabled={uploading}>
                삭제
              </Button>
            ) : null}
            {warning ? (
              <p className="max-w-[320px] text-[11px] leading-relaxed text-[#B97D10]">{warning}</p>
            ) : null}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(event) => void handleSelect(event)}
        />
      </div>
    </MediaField>
  );
}
