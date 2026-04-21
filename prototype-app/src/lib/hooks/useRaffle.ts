'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchRaffles, enterRaffle } from '@/lib/queries/raffle';
import { TEST_USER_ID } from '@/lib/constants';

export function useRaffles(artistId: string) {
  return useQuery({
    queryKey: ['raffles', artistId, TEST_USER_ID],
    queryFn: () => fetchRaffles(artistId, TEST_USER_ID),
    enabled: !!artistId,
  });
}

export function useEnterRaffle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ raffleId, ticketCount }: { raffleId: string; ticketCount: number }) =>
      enterRaffle(TEST_USER_ID, raffleId, ticketCount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raffles'] });
      queryClient.invalidateQueries({ queryKey: ['user-tickets'] });
    },
  });
}
