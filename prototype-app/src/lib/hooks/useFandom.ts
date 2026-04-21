'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchFandomLevel } from '@/lib/queries/fandom';
import { TEST_USER_ID } from '@/lib/constants';

export function useFandomLevel(artistId: string) {
  return useQuery({
    queryKey: ['fandom-level', artistId, TEST_USER_ID],
    queryFn: () => fetchFandomLevel(artistId, TEST_USER_ID),
    enabled: !!artistId,
  });
}
