'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMemories,
  fetchMemoryById,
  createMemory,
  updateMemory,
  deleteMemory,
  getMonthlyMemoryCount,
} from '@/lib/queries/memory';
import { TEST_USER_ID } from '@/lib/constants';

export function useMemories(artistId: string, year?: number, month?: number) {
  return useQuery({
    queryKey: ['memories', TEST_USER_ID, artistId, year, month],
    queryFn: () => fetchMemories(TEST_USER_ID, artistId, year, month),
    enabled: !!artistId,
  });
}

export function useMemoryDetail(memoryId: string) {
  return useQuery({
    queryKey: ['memory-detail', memoryId],
    queryFn: () => fetchMemoryById(memoryId),
    enabled: !!memoryId,
  });
}

export function useCreateMemory(artistId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      emojis: string[];
      emojiLabels: string[];
      date: string;
      text?: string;
      location?: string;
      isPublic: boolean;
      imageUrls?: string[];
    }) =>
      createMemory({
        userId: TEST_USER_ID,
        artistId,
        ...params,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      queryClient.invalidateQueries({ queryKey: ['user-currency'] });
    },
  });
}

export function useUpdateMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      memoryId,
      ...params
    }: {
      memoryId: string;
      emojis?: string[];
      emojiLabels?: string[];
      text?: string;
      location?: string;
      isPublic?: boolean;
    }) => updateMemory(memoryId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      queryClient.invalidateQueries({ queryKey: ['memory-detail'] });
    },
  });
}

export function useDeleteMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memoryId: string) => deleteMemory(memoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });
}

export function useMonthlyMemoryCount(artistId: string) {
  return useQuery({
    queryKey: ['memory-count', TEST_USER_ID, artistId],
    queryFn: () => getMonthlyMemoryCount(TEST_USER_ID, artistId),
    enabled: !!artistId,
  });
}
