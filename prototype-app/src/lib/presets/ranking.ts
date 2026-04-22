import { supabase } from '@/lib/supabase';
import type { QueryClient } from '@tanstack/react-query';
import { TEST_USER_ID } from '@/lib/constants';

export const RANKING_PRESET_OPTIONS = [
  { key: 'current', label: '현재 시즌 (38위)' },
  { key: 'outside100', label: 'TOP100 밖' },
  { key: 'prevSeason', label: '이전 시즌' },
  { key: 'guest', label: '비로그인' },
  { key: 'guestEmpty', label: '비로그인+Empty' },
];

export async function applyRankingPreset(preset: string, queryClient: QueryClient) {
  if (preset === 'outside100') {
    // Move test user to rank ~120 by reducing earned points
    await supabase
      .from('virtue_transactions')
      .update({ amount: 100 })
      .eq('user_id', TEST_USER_ID)
      .eq('season_id', 'season-2026-04');
  } else if (preset === 'current') {
    // Restore test user to rank 38
    await supabase
      .from('virtue_transactions')
      .update({ amount: 2450 })
      .eq('user_id', TEST_USER_ID)
      .eq('season_id', 'season-2026-04');
  }

  queryClient.invalidateQueries({ queryKey: ['ranking'] });
  queryClient.invalidateQueries({ queryKey: ['virtue-history'] });
  queryClient.invalidateQueries({ queryKey: ['user-currency'] });
}
