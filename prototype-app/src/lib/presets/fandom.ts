import { supabase } from '@/lib/supabase';
import type { QueryClient } from '@tanstack/react-query';
import { DEFAULT_ARTIST_ID } from '@/lib/constants';

export const FANDOM_PRESET_OPTIONS = [
  { key: 'progress', label: '진행중 (Lv.3)' },
  { key: 'max', label: 'MAX (Lv.10)' },
  { key: 'guest', label: '비로그인' },
  { key: 'guestEmpty', label: '비로그인+Empty' },
];

// v5.2 권장 곡선 + v5.0 캡 정책 반영:
// 곡선: Lv1 10,000 → Lv2 30,000 → Lv3 70,000 → Lv4 150,000 → Lv5 300,000 → Lv10 6,000,000
// 일일 500DUK / 주간 3,000DUK 캡 + 스트릭 보너스(캡 무관) → 월간 현실 상한 ≈ 14,000DUK
export async function applyFandomPreset(preset: string, queryClient: QueryClient) {
  if (preset === 'max') {
    await supabase
      .from('fandom_level_progress')
      .update({ current_level: 10, current_pt: 6500000, participant_count: 890, monthly_total: 14000 })
      .eq('artist_id', DEFAULT_ARTIST_ID);
  } else if (preset === 'progress') {
    await supabase
      .from('fandom_level_progress')
      .update({ current_level: 3, current_pt: 40000, participant_count: 342, monthly_total: 12000 })
      .eq('artist_id', DEFAULT_ARTIST_ID);
  }

  queryClient.invalidateQueries({ queryKey: ['fandom-level'] });
}
