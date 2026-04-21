'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchBiveItems } from '@/lib/queries/collection';
import { TEST_USER_ID } from '@/lib/constants';

export function useBiveItems(artistId: string) {
  return useQuery({
    queryKey: ['bive-items', artistId, TEST_USER_ID],
    queryFn: () => fetchBiveItems(artistId, TEST_USER_ID),
    enabled: !!artistId,
  });
}
