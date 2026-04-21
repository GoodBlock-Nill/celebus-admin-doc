'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchArtists, fetchFollowedArtists, followArtist, unfollowArtist } from '@/lib/queries/artists';
import { TEST_USER_ID } from '@/lib/constants';

export function useArtists() {
  return useQuery({
    queryKey: ['artists'],
    queryFn: fetchArtists,
  });
}

export function useFollowedArtists() {
  return useQuery({
    queryKey: ['followed-artists', TEST_USER_ID],
    queryFn: () => fetchFollowedArtists(TEST_USER_ID),
  });
}

export function useFollowArtist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (artistId: string) => followArtist(TEST_USER_ID, artistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followed-artists'] });
      queryClient.invalidateQueries({ queryKey: ['artists'] });
    },
  });
}

export function useUnfollowArtist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (artistId: string) => unfollowArtist(TEST_USER_ID, artistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followed-artists'] });
      queryClient.invalidateQueries({ queryKey: ['artists'] });
    },
  });
}
