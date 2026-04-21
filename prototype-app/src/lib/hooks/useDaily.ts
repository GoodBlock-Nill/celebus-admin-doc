'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDailyState, performCheckin, completeDailyMission, claimStreakBonus } from '@/lib/queries/daily';
import { TEST_USER_ID } from '@/lib/constants';

export function useDailyState(artistId: string) {
  return useQuery({
    queryKey: ['daily-state', TEST_USER_ID, artistId],
    queryFn: () => fetchDailyState(TEST_USER_ID, artistId),
    enabled: !!artistId,
  });
}

export function useCheckin(artistId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => performCheckin(TEST_USER_ID, artistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-state'] });
      queryClient.invalidateQueries({ queryKey: ['user-currency'] });
    },
  });
}

export function useCompleteMission(artistId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (missionId: string) => completeDailyMission(TEST_USER_ID, artistId, missionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-state'] });
      queryClient.invalidateQueries({ queryKey: ['user-currency'] });
    },
  });
}

export function useClaimStreakBonus(artistId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (daysMilestone: number) => claimStreakBonus(TEST_USER_ID, artistId, daysMilestone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-state'] });
    },
  });
}
