import type { QueryClient } from '@tanstack/react-query';

export const ARTIST_PRESET_OPTIONS = [
  { key: 'loginContent', label: '로그인+콘텐츠' },
  { key: 'loginEmpty', label: '로그인+Empty' },
  { key: 'guest', label: '비로그인' },
  { key: 'onboarding', label: '온보딩' },
];

export function getArtistPresetState(preset: string) {
  return {
    isLoggedIn: preset !== 'guest',
    showOnboarding: preset === 'onboarding',
    hasContent: preset === 'loginContent' || preset === 'guest',
  };
}
