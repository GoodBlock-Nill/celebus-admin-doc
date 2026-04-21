import { supabase } from '@/lib/supabase';
import type { QueryClient } from '@tanstack/react-query';
import { TEST_USER_ID } from '@/lib/constants';

const ALL_BIVE_IDS = ['bive-1', 'bive-2', 'bive-3', 'bive-4', 'bive-5', 'bive-6', 'bive-7', 'bive-8', 'bive-9'];

export const COLLECTION_PRESET_OPTIONS = [
  { key: 'partial', label: '일부 보유 (3/9)' },
  { key: 'all', label: '전체 보유' },
  { key: 'empty', label: 'Empty' },
];

export async function applyCollectionPreset(preset: string, queryClient: QueryClient) {
  // Clear all owned
  await supabase.from('user_bive_collection').delete().eq('user_id', TEST_USER_ID);

  if (preset === 'partial') {
    await supabase.from('user_bive_collection').insert([
      { user_id: TEST_USER_ID, bive_id: 'bive-1' },
      { user_id: TEST_USER_ID, bive_id: 'bive-4' },
      { user_id: TEST_USER_ID, bive_id: 'bive-8' },
    ]);
  } else if (preset === 'all') {
    await supabase.from('user_bive_collection').insert(
      ALL_BIVE_IDS.map((id) => ({ user_id: TEST_USER_ID, bive_id: id }))
    );
  }

  queryClient.invalidateQueries({ queryKey: ['bive-items'] });
}
