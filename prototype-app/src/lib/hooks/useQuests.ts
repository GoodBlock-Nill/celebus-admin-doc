'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchQuestChapters, submitMission, claimChapterGoods, fetchRepeatingQuests } from '@/lib/queries/quests';
import { TEST_USER_ID } from '@/lib/constants';

export function useQuestChapters(artistId: string) {
  return useQuery({
    queryKey: ['quest-chapters', TEST_USER_ID, artistId],
    queryFn: () => fetchQuestChapters(TEST_USER_ID, artistId),
    enabled: !!artistId,
  });
}

export function useSubmitMission(artistId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ missionId, imageUrl }: { missionId: string; imageUrl?: string }) =>
      submitMission(TEST_USER_ID, missionId, imageUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quest-chapters', TEST_USER_ID, artistId] });
    },
  });
}

export function useClaimGoods(artistId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chapterId: string) => claimChapterGoods(TEST_USER_ID, chapterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quest-chapters', TEST_USER_ID, artistId] });
    },
  });
}

export function useRepeatingQuests(artistId: string) {
  return useQuery({
    queryKey: ['repeating-quests', artistId],
    queryFn: () => fetchRepeatingQuests(artistId),
    enabled: !!artistId,
  });
}
