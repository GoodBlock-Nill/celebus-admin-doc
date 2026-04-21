import type { QueryClient } from '@tanstack/react-query';

export const HOME_PRESET_OPTIONS = [
  { key: 'loginContent', label: '로그인+콘텐츠' },
  { key: 'loginEmpty', label: '로그인+Empty' },
  { key: 'allDone', label: '완료 상태' },
  { key: 'guest', label: '비로그인' },
];

export function getHomePresetState(preset: string) {
  return {
    isLoggedIn: preset !== 'guest',
    hasContent: preset === 'loginContent' || preset === 'guest' || preset === 'allDone',
    isAllDone: preset === 'allDone',
  };
}
