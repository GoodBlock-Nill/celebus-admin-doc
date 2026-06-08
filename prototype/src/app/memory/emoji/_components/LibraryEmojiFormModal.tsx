'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import ImageUpload from '@/components/clone/ImageUpload';
import { LangField, isAllLangsFilled, type Lang } from '@/components/clone/LangField';
import type { LibraryEmoji } from '@/mock/memoryEmoji';
import type { LibraryEmojiInput } from '@/stores/memoryEmojiStore';

// [CEB-BO-MEM-502-MD-EMOJI] 감정 이모지 라이브러리 등록·수정 모달
// - 이미지 업로드(필수) + 라벨 한/영/일(3언어 필수) — 유니코드·사용여부·순서 없음
// - 수정 모드: 연결 아티스트 수 안내 표시 (즉시 전역 반영 안내)

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initial?: LibraryEmoji;
  linkedCount?: number; // 수정 모드 시 연결된 아티스트 수
  onSubmit: (data: LibraryEmojiInput) => void;
}

const emptyLang = { KO: '', EN: '', JA: '' };

export default function LibraryEmojiFormModal({ isOpen, onClose, mode, initial, linkedCount = 0, onSubmit }: Props) {
  const [imageSrc, setImageSrc] = useState('');
  const [label, setLabel] = useState({ ...emptyLang });
  const [labelLang, setLabelLang] = useState<Lang>('KO');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setImageSrc(initial?.imageSrc ?? '');
    setLabel({
      KO: initial?.labelKO ?? '',
      EN: initial?.labelEN ?? '',
      JA: initial?.labelJA ?? '',
    });
    setLabelLang('KO');
    setTouched(false);
  }, [isOpen, initial]);

  const isEdit = mode === 'edit';
  const imageValid = imageSrc.trim().length > 0;
  const labelValid = isAllLangsFilled(label);
  const canSubmit = imageValid && labelValid;

  const imageError = touched && !imageValid ? '이미지를 업로드하세요' : null;

  const handleSubmit = () => {
    setTouched(true);
    if (!canSubmit) return;
    onSubmit({
      imageSrc: imageSrc.trim(),
      labelKO: label.KO.trim(),
      labelEN: label.EN.trim(),
      labelJA: label.JA.trim(),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? '감정 이모지 수정' : '감정 이모지 등록'}
      width="max-w-md"
      footer={
        <>
          <button
            onClick={onClose}
            className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            저장
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* 수정 모드 안내 */}
        {isEdit && linkedCount > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-700">
              이 이모지를 연결한 <span className="font-semibold">{linkedCount}개</span> 아티스트의 앱 표시에 즉시 반영됩니다.
            </p>
          </div>
        )}

        {/* 이미지 업로드 */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            이모지 이미지 <span className="text-red-500">*</span>
          </label>
          <ImageUpload
            value={imageSrc}
            onChange={setImageSrc}
            ratio="1/1"
            required
            mode={isEdit ? 'edit' : 'create'}
          />
          {imageError ? (
            <p className="text-xs text-rose-600 mt-1">{imageError}</p>
          ) : (
            <p className="text-xs text-gray-400 mt-1">정사각형 권장 · JPG·PNG·WebP · 5MB 이하</p>
          )}
        </div>

        {/* 라벨 (한/영/일) */}
        <LangField
          label="감정 라벨"
          required
          lang={labelLang}
          onLangChange={setLabelLang}
          value={label[labelLang]}
          onChange={(v) => setLabel({ ...label, [labelLang]: v })}
          values={label}
          maxLength={20}
          placeholder="예: 설렘 / Flutter / ときめき"
        />
      </div>
    </Modal>
  );
}
