import { supabase } from '@/lib/supabase';
import type { QueryClient } from '@tanstack/react-query';
import { DEFAULT_ARTIST_ID } from '@/lib/constants';

export const FANDOM_PRESET_OPTIONS = [
  { key: 'progress', label: '진행중 (Lv.3)' },
  { key: 'max', label: 'MAX (Lv.10)' },
  { key: 'guest', label: '비로그인' },
  { key: 'guestEmpty', label: '비로그인+Empty' },
];

export async function applyFandomPreset(preset: string, queryClient: QueryClient) {
  if (preset === 'max') {
    await supabase
      .from('fandom_level_progress')
      .update({ current_level: 10, current_pt: 150000, participant_count: 890, monthly_total: 3500 })
      .eq('artist_id', DEFAULT_ARTIST_ID);
  } else if (preset === 'progress') {
    await supabase
      .from('fandom_level_progress')
      .update({ current_level: 3, current_pt: 3000, participant_count: 342, monthly_total: 1200 })
      .eq('artist_id', DEFAULT_ARTIST_ID);
  }

  queryClient.invalidateQueries({ queryKey: ['fandom-level'] });
}
