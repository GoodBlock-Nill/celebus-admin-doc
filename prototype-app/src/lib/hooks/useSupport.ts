'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSupportEvents, investInSupport } from '@/lib/queries/support';
import { TEST_USER_ID } from '@/lib/constants';

export function useSupportEvents(artistId: string) {
  return useQuery({
    queryKey: ['support-events', artistId, TEST_USER_ID],
    queryFn: () => fetchSupportEvents(artistId, TEST_USER_ID),
    enabled: !!artistId,
  });
}

export function useInvestSupport(artistId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, amount }: { eventId: string; amount: number }) =>
      investInSupport(TEST_USER_ID, eventId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-events'] });
      queryClient.invalidateQueries({ queryKey: ['user-currency'] });
    },
  });
}
