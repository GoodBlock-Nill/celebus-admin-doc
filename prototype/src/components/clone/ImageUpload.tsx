'use client';

import { useRef, useState, type DragEvent } from 'react';
import { ArrowUpTrayIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { toast } from '@/components/ui/Toast';

// 그룹 이미지 업로드(로고 1:1 / 대표이미지 16:9) 공용 컴포넌트.
// 실제 <input type=file> 피커 + 비율 고정 프레임 안 미리보기.
// (프레임은 크롭 결과 영역을 의미 — 전체 크롭 UI는 요구 범위 아님)
// 형식(JPG·PNG·WebP)·용량(≤5MB) 검증 후 위반 시 toast.error + 거부.
//
// edit 모드: 기존 이미지 노출 + [변경] 버튼(교체만). 필수 항목이므로 [제거] 없음.

interface Props {
  value: string; // 등록된 파일명 (빈 문자열 = 미등록)
  onChange: (filename: string) => void;
  ratio: '1/1' | '16/9'; // 프레임 비율
  required?: boolean;
  mode?: 'create' | 'edit';
}

const ACCEPT = '.jpg,.jpeg,.png,.webp';
const ACCEPT_EXTS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_SIZE_MB = 5;

export default function ImageUpload({ value, onChange, ratio, required = false, mode = 'create' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const validate = (file: File): boolean => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ACCEPT_EXTS.includes(ext)) {
      toast.error('지원하지 않는 형식입니다. (JPG·PNG·WebP)');
      return false;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error('이미지 용량은 5MB 이하만 등록할 수 있습니다.');
      return false;
    }
    return true;
  };

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;
    if (validate(file)) onChange(file.name);
  };

  const openPicker = () => inputRef.current?.click();

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const frameStyle = { aspectRatio: ratio.replace('/', ' / ') };
  const frameWidthClass = ratio === '1/1' ? 'w-32' : 'w-full max-w-md';

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!isDragOver) setIsDragOver(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
      onDrop={handleDrop}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={value ? undefined : openPicker}
        onKeyDown={(e) => { if (!value && (e.key === 'Enter' || e.key === ' ')) openPicker(); }}
        style={frameStyle}
        className={`${frameWidthClass} overflow-hidden rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-colors ${
          value
            ? 'border-gray-200 bg-gray-50'
            : isDragOver
              ? 'border-indigo-500 bg-indigo-50/60 text-indigo-600 cursor-pointer'
              : 'border-gray-300 text-gray-400 hover:border-indigo-300 hover:bg-gray-50 cursor-pointer'
        }`}
      >
        {value ? (
          // 미리보기 — 파일 객체 URL이 없는 mock 환경이므로 파일명 + 아이콘으로 표현(크롭 결과 프레임)
          <div className="flex flex-col items-center justify-center px-3">
            <PhotoIcon className="w-8 h-8 text-indigo-400 mb-1.5" />
            <span className="text-xs font-medium text-gray-700 break-all line-clamp-2">{value}</span>
          </div>
        ) : (
          <>
            <ArrowUpTrayIcon className="w-7 h-7 mb-1.5" />
            <span className="text-xs px-3">클릭하거나 파일을 드래그하세요</span>
          </>
        )}
      </div>

      {value && (
        <button
          type="button"
          onClick={openPicker}
          className="mt-2 h-8 px-3 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
        >
          {mode === 'edit' ? '변경' : '이미지 변경'}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = ''; // 같은 파일 재선택 허용
        }}
      />
    </div>
  );
}
