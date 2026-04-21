import type { QueryClient } from '@tanstack/react-query';

export const MEMORY_DETAIL_PRESET_OPTIONS = [
  { key: 'photo', label: '사진 (내 것)' },
  { key: 'letter', label: '편지 (내 것)' },
  { key: 'publicOther', label: '공개 (타인)' },
  { key: 'privateLocked', label: '비공개 차단' },
  { key: 'sharedGuest', label: '공유 링크 (비로그인)' },
];

export function getMemoryDetailPresetState(preset: string) {
  return {
    isMine: preset === 'photo' || preset === 'letter',
    isPublic: preset !== 'privateLocked',
    isGuest: preset === 'sharedGuest',
    type: preset === 'letter' ? 'letter' : 'photo',
    isLocked: preset === 'privateLocked',
  };
}
