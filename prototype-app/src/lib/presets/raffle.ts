import { supabase } from '@/lib/supabase';
import type { QueryClient } from '@tanstack/react-query';
import { TEST_USER_ID } from '@/lib/constants';

export const RAFFLE_PRESET_OPTIONS = [
  { key: 'mixed', label: '혼합' },
  { key: 'allActive', label: '전체 진행중' },
  { key: 'allClosed', label: '전체 마감 (당첨/미당첨)' },
  { key: 'empty', label: 'Empty' },
];

export async function applyRafflePreset(preset: string, queryClient: QueryClient) {
  if (preset === 'allActive') {
    await supabase.from('raffles').update({ status: 'active' }).neq('id', '__none__');
    await supabase.from('user_raffle_entries').update({ result: 'pending' }).eq('user_id', TEST_USER_ID);
  } else if (preset === 'allClosed') {
    await supabase.from('raffles').update({ status: 'closed' }).neq('id', '__none__');
    await supabase.from('user_raffle_entries').update({ result: 'winner' }).eq('user_id', TEST_USER_ID).eq('raffle_id', 'raffle-1');
    await supabase.from('user_raffle_entries').update({ result: 'loser' }).eq('user_id', TEST_USER_ID).eq('raffle_id', 'raffle-3');
  } else if (preset === 'mixed') {
    await supabase.from('raffles').update({ status: 'active' }).in('id', ['raffle-1', 'raffle-2']);
    await supabase.from('raffles').update({ status: 'closed' }).eq('id', 'raffle-3');
    await supabase.from('user_raffle_entries').update({ result: 'pending' }).eq('user_id', TEST_USER_ID).eq('raffle_id', 'raffle-1');
    await supabase.from('user_raffle_entries').update({ result: 'loser' }).eq('user_id', TEST_USER_ID).eq('raffle_id', 'raffle-3');
  } else if (preset === 'empty') {
    await supabase.from('raffles').update({ status: 'closed' }).neq('id', '__none__');
    await supabase.from('user_raffle_entries').delete().eq('user_id', TEST_USER_ID);
  }

  queryClient.invalidateQueries({ queryKey: ['raffles'] });
}
