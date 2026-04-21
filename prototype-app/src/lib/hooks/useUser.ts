'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchUser, fetchUserCurrency, fetchUserTickets } from '@/lib/queries/user';
import { TEST_USER_ID } from '@/lib/constants';

export function useUser() {
  return useQuery({
    queryKey: ['user', TEST_USER_ID],
    queryFn: () => fetchUser(TEST_USER_ID),
  });
}

export function useUserCurrency(artistId: string) {
  return useQuery({
    queryKey: ['user-currency', TEST_USER_ID, artistId],
    queryFn: () => fetchUserCurrency(TEST_USER_ID, artistId),
    enabled: !!artistId,
  });
}

export function useUserTickets() {
  return useQuery({
    queryKey: ['user-tickets', TEST_USER_ID],
    queryFn: () => fetchUserTickets(TEST_USER_ID),
  });
}
