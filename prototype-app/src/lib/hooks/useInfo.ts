'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchInfoItems, toggleAlarm } from '@/lib/queries/info';
import { TEST_USER_ID } from '@/lib/constants';

export function useInfoItems(artistId: string) {
  return useQuery({
    queryKey: ['info-items', artistId, TEST_USER_ID],
    queryFn: () => fetchInfoItems(artistId, TEST_USER_ID),
    enabled: !!artistId,
  });
}

export function useToggleAlarm(artistId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ infoItemId, alarmOn }: { infoItemId: string; alarmOn: boolean }) =>
      toggleAlarm(TEST_USER_ID, infoItemId, alarmOn),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['info-items', artistId] });
    },
  });
}
