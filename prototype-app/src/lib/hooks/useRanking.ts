'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchRanking, fetchSeasons, fetchVirtueHistory } from '@/lib/queries/ranking';
import { TEST_USER_ID } from '@/lib/constants';

export function useSeasons(artistId: string) {
  return useQuery({
    queryKey: ['seasons', artistId],
    queryFn: () => fetchSeasons(artistId),
    enabled: !!artistId,
  });
}

export function useRanking(artistId: string, seasonId: string) {
  return useQuery({
    queryKey: ['ranking', artistId, seasonId],
    queryFn: () => fetchRanking(artistId, seasonId, TEST_USER_ID),
    enabled: !!artistId && !!seasonId,
  });
}

export function useVirtueHistory(artistId: string) {
  return useQuery({
    queryKey: ['virtue-history', TEST_USER_ID, artistId],
    queryFn: () => fetchVirtueHistory(TEST_USER_ID, artistId),
    enabled: !!artistId,
  });
}
