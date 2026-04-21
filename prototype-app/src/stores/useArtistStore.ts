'use client';

import { create } from 'zustand';
import { DEFAULT_ARTIST_ID } from '@/lib/constants';

interface ArtistState {
  activeArtistId: string;
  setActiveArtist: (id: string) => void;
}

export const useArtistStore = create<ArtistState>((set) => ({
  activeArtistId: DEFAULT_ARTIST_ID,
  setActiveArtist: (id: string) => set({ activeArtistId: id }),
}));
