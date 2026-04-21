import { supabase } from '@/lib/supabase';
import type { QueryClient } from '@tanstack/react-query';
import { TEST_USER_ID, DEFAULT_ARTIST_ID } from '@/lib/constants';

export const MEMORY_PRESET_OPTIONS = [
  { key: 'many', label: '다수 기억 (5개)' },
  { key: 'single', label: '단일 기억' },
  { key: 'empty', label: 'Empty' },
  { key: 'limitReached', label: '한도 초과 (50개)' },
];

export async function applyMemoryPreset(preset: string, queryClient: QueryClient) {
  // Clear memories
  await supabase.from('memory_images').delete().neq('id', 0);
  await supabase.from('memories').delete().eq('user_id', TEST_USER_ID);

  if (preset === 'many' || preset === 'limitReached') {
    const memories = [
      { id: 'mem-1', emojis: ['💜', '🎵'], emoji_labels: ['사랑', '음악'], date: '2026-04-20', text: '오늘 V01D 신곡 들었는데 너무 좋다! 최고 💜', location: '서울 강남', is_public: true },
      { id: 'mem-2', emojis: ['🎉'], emoji_labels: ['축하'], date: '2026-04-18', text: '팬미팅 티켓 당첨!! 기대된다', location: null, is_public: false },
      { id: 'mem-3', emojis: ['😭', '💜'], emoji_labels: ['감동', '사랑'], date: '2026-04-15', text: '뮤직뱅크 1위 축하해요! 감동이다...', location: '서울 여의도 KBS', is_public: true },
      { id: 'mem-4', emojis: ['📸'], emoji_labels: ['사진'], date: '2026-04-10', text: '포토카드 도착! 너무 예쁘다', location: '집', is_public: false },
      { id: 'mem-5', emojis: ['🎤', '✨'], emoji_labels: ['공연', '반짝'], date: '2026-04-05', text: '첫 콘서트 다녀왔다. 잊을 수 없는 밤!', location: '서울 올림픽공원', is_public: true },
    ];

    for (const m of memories) {
      await supabase.from('memories').insert({
        ...m,
        user_id: TEST_USER_ID,
        artist_id: DEFAULT_ARTIST_ID,
      });
    }

    await supabase.from('memory_images').insert([
      { memory_id: 'mem-1', image_url: '/v01d/logo.png', sort_order: 0 },
      { memory_id: 'mem-3', image_url: '/v01d/logo.png', sort_order: 0 },
      { memory_id: 'mem-5', image_url: '/v01d/logo.png', sort_order: 0 },
      { memory_id: 'mem-5', image_url: '/v01d/logo.png', sort_order: 1 },
    ]);
  } else if (preset === 'single') {
    await supabase.from('memories').insert({
      id: 'mem-single',
      user_id: TEST_USER_ID,
      artist_id: DEFAULT_ARTIST_ID,
      emojis: ['💜'],
      emoji_labels: ['사랑'],
      date: '2026-04-20',
      text: '첫 기억!',
      is_public: true,
    });
  }

  queryClient.invalidateQueries({ queryKey: ['memories'] });
  queryClient.invalidateQueries({ queryKey: ['memory-count'] });
}
