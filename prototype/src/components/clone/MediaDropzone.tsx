'use client';

import { useState, type DragEvent } from 'react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';

// [CEB-BO-004] §5 미디어 업로드 표준 컴포넌트
// 클릭 또는 드래그&드롭 둘 다 지원. 확장자·크기 검증 + 잘못된 파일 alert.

interface Props {
  value: string; // 등록된 파일명 (빈 문자열 = 미등록)
  onChange: (filename: string) => void;
  accept?: string; // ".png,.jpg,.jpeg,.gif,.webp,.mp4"
  acceptLabel?: string; // "PNG, JPG, GIF, WebP, MP4" (alert 메시지용)
  maxSizeMB?: number; // 기본 20MB
  emptyLabel?: string; // 박스 안 안내 — 기본 "클릭하거나 파일을 드래그하세요"
}

const DEFAULT_ACCEPT = '.png,.jpg,.jpeg,.gif,.webp,.mp4';
const DEFAULT_ACCEPT_LABEL = 'PNG, JPG, GIF, WebP, MP4';

export default function MediaDropzone({
  value,
  onChange,
  accept = DEFAULT_ACCEPT,
  acceptLabel = DEFAULT_ACCEPT_LABEL,
  maxSizeMB = 20,
  emptyLabel = '클릭하거나 파일을 드래그하세요',
}: Props) {
  const [isDragOver, setIsDragOver] = useState(false);

  const acceptExts = accept.split(',').map((e) => e.trim().toLowerCase().replace(/^\./, ''));
  const validateFile = (file: File): boolean => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!acceptExts.includes(ext)) {
      alert(`허용된 확장자만 등록 가능합니다: ${acceptLabel}`);
      return false;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`파일 크기는 최대 ${maxSizeMB}MB까지 가능합니다. (현재 ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      return false;
    }
    return true;
  };

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;
    if (validateFile(file)) onChange(file.name);
  };

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  return (
    <label
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`block w-full aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
        isDragOver
          ? 'border-indigo-500 bg-indigo-50/60 text-indigo-600'
          : 'border-gray-300 text-gray-400 hover:border-indigo-300 hover:bg-gray-50 bg-white'
      }`}
    >
      {value ? (
        <>
          <span className="text-sm text-gray-700 font-medium text-center px-3 break-all">{value}</span>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onChange(''); }}
            className="mt-3 text-xs text-red-500 hover:underline"
          >
            파일 제거
          </button>
        </>
      ) : (
        <>
          <ArrowUpTrayIcon className="w-8 h-8 mb-2" />
          <span className="text-sm text-center px-3">{emptyLabel}</span>
        </>
      )}
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </label>
  );
}
