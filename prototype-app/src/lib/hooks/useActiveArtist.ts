'use client';

import { useArtistStore } from '@/stores/useArtistStore';
import { useArtists } from './useArtists';
import type { Artist } from '@/lib/types';

const FALLBACK_ARTIST: Artist = {
  id: 'v01d',
  name: 'V01D',
  nameEn: 'V01D',
  logoUrl: '/v01d/logo.png',
  backgroundUrl: '/v01d/background.jpg',
  members: [],
};

export function useActiveArtist() {
  const activeArtistId = useArtistStore((s) => s.activeArtistId);
  const { data: artists } = useArtists();

  const activeArtist = artists?.find((a) => a.id === activeArtistId) ?? FALLBACK_ARTIST;

  return {
    activeArtistId,
    activeArtist,
    artistName: activeArtist.name,
    artists: artists ?? [FALLBACK_ARTIST],
  };
}
