'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchEvents, fetchBanners, fetchNotices } from '@/lib/queries/events';

export function useEvents(artistId: string, filter?: 'active' | 'closing' | 'closed') {
  return useQuery({
    queryKey: ['events', artistId, filter],
    queryFn: () => fetchEvents(artistId, filter),
    enabled: !!artistId,
  });
}

export function useBanners(artistId: string) {
  return useQuery({
    queryKey: ['banners', artistId],
    queryFn: () => fetchBanners(artistId),
    enabled: !!artistId,
  });
}

export function useNotices() {
  return useQuery({
    queryKey: ['notices'],
    queryFn: fetchNotices,
  });
}
