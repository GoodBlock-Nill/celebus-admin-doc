'use client';

import { useEffect, useState } from 'react';
import { FaceSmileIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import ImageUpload from '@/components/clone/ImageUpload';
import { LangField, isAllLangsFilled, type Lang } from '@/components/clone/LangField';
import type { EmotionEmoji } from '@/mock/memoryEmoji';
import type { EmojiInput } from '@/stores/memoryEmojiStore';

// [CEB-BO-MEM-501-MD-EMOJI] 감정 이모지 추가·수정 모달 (생성·수정 겸용)
// - 방식: OS 유니코드 이모지 입력 / 커스텀 이미지 업로드 중 선택 (옵션 카드)
// - 라벨(한/영/일, 각 20자) + 사용여부 (사용 상한 6 도달 시 ON 비활성)
// - 세트 내 동일 유니코드 이모지 중복 금지 (라벨은 중복 허용)

type EmojiKind = 'emoji' | 'image';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initial?: EmotionEmoji;
  siblings: EmotionEmoji[]; // 동일 아티스트 세트 — 이모지 중복 검증용
  canEnableActive: boolean; // 사용 상한(6) 여유 (편집 중 항목이 이미 사용이면 true)
  onSubmit: (data: EmojiInput) => void;
}

const emptyLang = { KO: '', EN: '', JA: '' };

const KIND_OPTIONS: { kind: EmojiKind; title: string; desc: string }[] = [
  { kind: 'emoji', title: 'OS 이모지', desc: '휴대폰 기본 이모지 입력' },
  { kind: 'image', title: '커스텀 이미지', desc: '정사각형 이미지 업로드' },
];

export default function EmojiFormModal({ isOpen, onClose, mode, initial, siblings, canEnableActive, onSubmit }: Props) {
  const [kind, setKind] = useState<EmojiKind>('emoji');
  const [emoji, setEmoji] = useState('');
  const [imageSrc, setImageSrc] = useState('');
  const [label, setLabel] = useState({ ...emptyLang });
  const [labelLang, setLabelLang] = useState<Lang>('KO');
  const [active, setActive] = useState(true);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const isImage = !!initial?.imageSrc;
    setKind(isImage ? 'image' : 'emoji');
    setEmoji(initial?.emoji ?? '');
    setImageSrc(initial?.imageSrc ?? '');
    setLabel({
      KO: initial?.labelKO ?? '',
      EN: initial?.labelEN ?? '',
      JA: initial?.labelJA ?? '',
    });
    // 신규: 여유 있으면 사용 기본 ON, 상한 도달 시 미사용. 수정: 기존 값 유지.
    setActive(initial ? initial.active : canEnableActive);
    setLabelLang('KO');
    setTouched(false);
  }, [isOpen, initial, canEnableActive]);

  const isEdit = mode === 'edit';
  const emojiTrim = emoji.trim();

  const duplicate =
    kind === 'emoji' &&
    siblings.some((e) => e.emoji === emojiTrim && emojiTrim !== '' && (!isEdit || e.id !== initial?.id));

  const sourceValid = kind === 'emoji' ? emojiTrim.length > 0 && !duplicate : imageSrc.trim().length > 0;
  const labelValid = isAllLangsFilled(label);
  const canSubmit = sourceValid && labelValid;

  const emojiError =
    kind === 'emoji'
      ? touched && emojiTrim.length === 0
        ? '이모지를 입력하세요'
        : duplicate
          ? '이미 등록된 이모지입니다'
          : null
      : touched && imageSrc.trim().length === 0
        ? '이미지를 업로드하세요'
        : null;

  // 사용여부 토글 — 미사용→사용 전환은 사용 상한 여유가 있을 때만
  const activateLocked = !active && !canEnableActive;
  const toggleActive = () => {
    if (activateLocked) return;
    setActive((v) => !v);
  };

  const handleSubmit = () => {
    setTouched(true);
    if (!canSubmit) return;
    onSubmit({
      emoji: kind === 'emoji' ? emojiTrim : '',
      imageSrc: kind === 'image' ? imageSrc.trim() : undefined,
      labelKO: label.KO.trim(),
      labelEN: label.EN.trim(),
      labelJA: label.JA.trim(),
      active,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? '감정 이모지 수정' : '감정 이모지 추가'}
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
        {/* 방식 선택 — 옵션 카드 */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            이모지 방식 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {KIND_OPTIONS.map((opt) => {
              const selected = kind === opt.kind;
              const Icon = opt.kind === 'emoji' ? FaceSmileIcon : PhotoIcon;
              return (
                <button
                  key={opt.kind}
                  type="button"
                  onClick={() => setKind(opt.kind)}
                  className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-colors ${
                    selected ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${selected ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <span>
                    <span className={`block text-sm font-semibold ${selected ? 'text-indigo-700' : 'text-gray-800'}`}>{opt.title}</span>
                    <span className="block text-[11px] text-gray-500 mt-0.5">{opt.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 이모지 입력 / 이미지 업로드 */}
        {kind === 'emoji' ? (
          <div>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 shrink-0 flex items-center justify-center text-3xl border border-gray-200 rounded-lg bg-gray-50">
                {emojiTrim || '🙂'}
              </div>
              <input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="OS 이모지 키보드로 입력 (예: 😍)"
                maxLength={8}
                className={`flex-1 h-11 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                  emojiError ? 'border-rose-300 focus:ring-rose-500' : 'border-gray-200 focus:ring-indigo-500'
                }`}
              />
            </div>
            {emojiError ? (
              <p className="text-xs text-rose-600 mt-1">{emojiError}</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">시스템 기본 유니코드 이모지를 입력합니다.</p>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              커스텀 이미지 <span className="text-red-500">*</span>
            </label>
            <ImageUpload
              value={imageSrc}
              onChange={setImageSrc}
              ratio="1/1"
              required
              mode={isEdit ? 'edit' : 'create'}
            />
            {emojiError ? (
              <p className="text-xs text-rose-600 mt-1">{emojiError}</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">정사각형 권장 · JPG·PNG·WebP · 5MB 이하</p>
            )}
          </div>
        )}

        {/* 라벨 (한/영/일) — 라벨 중복 허용 */}
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

        {/* 사용여부 (사용 상한 6) */}
        <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">사용여부</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {activateLocked
                ? '사용은 최대 6개까지 가능합니다. 다른 이모지를 미사용으로 전환하세요.'
                : '미사용 시 앱 감정 선택지에서 숨겨집니다 (기존 기록은 보존).'}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleActive}
            disabled={activateLocked}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              active ? 'bg-indigo-600' : 'bg-gray-300'
            } ${activateLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${active ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>
    </Modal>
  );
}
