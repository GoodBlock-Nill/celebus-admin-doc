import type { QueryClient } from '@tanstack/react-query';

export const ARTIST_DISCOVER_PRESET_OPTIONS = [
  { key: 'default', label: '기본 (1명 팔로우)' },
  { key: 'allFollowed', label: '전체 팔로우' },
  { key: 'searchEmpty', label: '검색결과 없음' },
  { key: 'guest', label: '비로그인' },
  { key: 'guestEmpty', label: '비로그인+Empty' },
];

export function getArtistDiscoverPresetState(preset: string) {
  return {
    isLoggedIn: preset !== 'guest' && preset !== 'guestEmpty',
    allFollowed: preset === 'allFollowed',
    forceSearchEmpty: preset === 'searchEmpty' || preset === 'guestEmpty',
  };
}
