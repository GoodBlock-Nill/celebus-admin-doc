'use client';

import { create } from 'zustand';
import type { Artist } from '@/lib/types';
import { MOCK_ARTISTS } from '@/mock/artists';

interface ArtistState {
  artists: Artist[];
  activeArtistId: string;
  activeArtist: Artist;
  setActiveArtist: (id: string) => void;
}

export const useArtistStore = create<ArtistState>((set, get) => ({
  artists: MOCK_ARTISTS,
  activeArtistId: MOCK_ARTISTS[0].id,
  activeArtist: MOCK_ARTISTS[0],
  setActiveArtist: (id: string) => {
    const artist = get().artists.find((a) => a.id === id);
    if (artist) {
      set({ activeArtistId: id, activeArtist: artist });
    }
  },
}));
