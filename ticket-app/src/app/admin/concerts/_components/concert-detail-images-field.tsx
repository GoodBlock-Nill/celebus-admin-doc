'use client';

import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

import { Button } from '../../_components/form';
import { useToast } from '../../_components/toast';
import { DETAIL_IMAGE_GUIDE, MAX_DETAIL_IMAGE_COUNT } from './concert-image-rules';
import { ConcertImageGuide, MediaField } from './concert-media-ui';
import { adminApi } from '@/lib/admin-client';

const ACCEPT = 'image/jpeg,image/png';
const COUNT_EXCEEDED = `상세 이미지는 최대 ${MAX_DETAIL_IMAGE_COUNT}장까지 등록할 수 있습니다.`;

/** 목록에서 한 칸 위/아래로 옮긴 새 배열을 만든다 (끝에서는 그대로 둔다) */
function moved(urls: string[], index: number, step: number): string[] {
  const target = index + step;
  if (target < 0 || target >= urls.length) return urls;

  const next = [...urls];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

interface DetailImagesFieldProps {
  urls: string[];
  error?: string;
  onChange: (urls: string[]) => void;
}

/** 상세 이미지 등록 — 여러 장을 올리고 앱에 보일 순서를 위·아래로 조정한다(선택 입력). */
export function ConcertDetailImagesField({ urls, error, onChange }: DetailImagesFieldProps) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // 같은 파일을 다시 고를 수 있도록 선택 값을 비운다.
    event.target.value = '';
    if (files.length === 0) return;

    if (urls.length + files.length > MAX_DETAIL_IMAGE_COUNT) {
      toast.error(`${COUNT_EXCEEDED} (현재 ${urls.length}장)`);
      return;
    }

    setUploading(true);
    const uploaded: string[] = [];
    for (const file of files) {
      const result = await adminApi.uploadImage(file, 'detail');
      if (!result.ok) {
        toast.error(`${file.name} — ${result.reason}`);
        break;
      }
      uploaded.push(result.data.url);
    }
    setUploading(false);

    if (uploaded.length === 0) return;
    onChange([...urls, ...uploaded]);
    toast.success(`상세 이미지 ${uploaded.length}장을 등록했습니다.`);
  };

  return (
    <MediaField
      label="상세 이미지"
      error={error}
      hint={`앱 공연 상세에서 아래 순서대로 세로로 이어 보여 줍니다. (선택 입력 · ${urls.length}/${MAX_DETAIL_IMAGE_COUNT}장)`}
    >
      <div className="flex flex-col gap-3">
        <ConcertImageGuide lines={DETAIL_IMAGE_GUIDE} />

        <div>
          <Button
            onClick={() => inputRef.current?.click()}
            disabled={uploading || urls.length >= MAX_DETAIL_IMAGE_COUNT}
          >
            {uploading ? '업로드 중…' : '이미지 추가'}
          </Button>
        </div>

        {urls.length > 0 ? (
          <ol className="flex flex-col gap-2">
            {urls.map((url, index) => (
              <li
                key={url}
                className="flex items-center gap-3 rounded-lg border border-[#E3E5EA] bg-white px-3 py-2"
              >
                <span className="w-5 shrink-0 text-center text-[12px] font-bold tabular-nums text-[#6B7080]">
                  {index + 1}
                </span>
                <img
                  src={url}
                  alt={`상세 이미지 ${index + 1}`}
                  className="h-14 w-24 shrink-0 rounded-md border border-[#E3E5EA] object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="ml-auto flex items-center gap-1.5">
                  <Button
                    size="sm"
                    onClick={() => onChange(moved(urls, index, -1))}
                    disabled={index === 0}
                  >
                    위로
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onChange(moved(urls, index, 1))}
                    disabled={index === urls.length - 1}
                  >
                    아래로
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => onChange(urls.filter((_, position) => position !== index))}
                  >
                    삭제
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        ) : null}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(event) => void handleSelect(event)}
        />
      </div>
    </MediaField>
  );
}
