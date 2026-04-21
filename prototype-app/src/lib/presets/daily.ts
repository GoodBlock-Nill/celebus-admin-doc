import { supabase } from '@/lib/supabase';
import type { QueryClient } from '@tanstack/react-query';
import { TEST_USER_ID, DEFAULT_ARTIST_ID } from '@/lib/constants';

export const DAILY_PRESET_OPTIONS = [
  { key: 'default', label: '미완료' },
  { key: 'checkedIn', label: '출석만 완료' },
  { key: 'allDone', label: '전체 완료' },
  { key: 'bonus', label: '보너스 달성 (14일)' },
];

export async function applyDailyPreset(preset: string, queryClient: QueryClient) {
  const today = new Date().toISOString().split('T')[0];

  // Reset today's checkin
  await supabase
    .from('user_daily_checkins')
    .delete()
    .eq('user_id', TEST_USER_ID)
    .eq('artist_id', DEFAULT_ARTIST_ID)
    .eq('checkin_date', today);

  // Reset today's mission
  await supabase
    .from('user_daily_missions')
    .delete()
    .eq('user_id', TEST_USER_ID)
    .eq('artist_id', DEFAULT_ARTIST_ID)
    .eq('mission_date', today);

  if (preset === 'checkedIn' || preset === 'allDone') {
    await supabase.from('user_daily_checkins').insert({
      user_id: TEST_USER_ID,
      artist_id: DEFAULT_ARTIST_ID,
      checkin_date: today,
    });
  }

  if (preset === 'allDone') {
    const { data: pool } = await supabase.from('daily_mission_pool').select('id').limit(1);
    if (pool?.[0]) {
      await supabase.from('user_daily_missions').insert({
        user_id: TEST_USER_ID,
        artist_id: DEFAULT_ARTIST_ID,
        mission_id: pool[0].id,
        mission_date: today,
        completed: true,
        completed_at: new Date().toISOString(),
      });
    }
  }

  if (preset === 'bonus') {
    await supabase
      .from('user_streaks')
      .upsert({
        user_id: TEST_USER_ID,
        artist_id: DEFAULT_ARTIST_ID,
        current_streak: 14,
        last_checkin_date: today,
      });

    await supabase
      .from('user_streak_bonuses')
      .update({ claimed: false })
      .eq('user_id', TEST_USER_ID)
      .eq('artist_id', DEFAULT_ARTIST_ID)
      .eq('days_milestone', 14);
  } else {
    await supabase
      .from('user_streaks')
      .upsert({
        user_id: TEST_USER_ID,
        artist_id: DEFAULT_ARTIST_ID,
        current_streak: 12,
        last_checkin_date: today,
      });
  }

  queryClient.invalidateQueries({ queryKey: ['daily-state'] });
}
