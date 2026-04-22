import type { QueryClient } from '@tanstack/react-query';

export const INFO_PRESET_OPTIONS = [
  { key: 'rich', label: '콘텐츠 풍부' },
  { key: 'noticeOnly', label: '공지만' },
  { key: 'empty', label: 'Empty' },
  { key: 'guest', label: '비로그인' },
  { key: 'guestEmpty', label: '비로그인+Empty' },
];

// Info presets use local filtering rather than DB manipulation
// since the data doesn't need complex state changes
export function getInfoPresetFilter(preset: string) {
  return {
    showNotice: preset !== 'empty' && preset !== 'guestEmpty',
    showTimeline: preset === 'rich' || preset === 'guest',
    isGuest: preset === 'guest' || preset === 'guestEmpty',
  };
}
