import { supabase } from '@/lib/supabase';
import type { QueryClient } from '@tanstack/react-query';

const PRESETS = {
  mixed: [
    { id: 'sup-1', status: 'active', current_pt: 10500, target_pt: 15000, participants: 128, days_left: 5, result_message: null },
    { id: 'sup-2', status: 'completed', current_pt: 32000, target_pt: 30000, participants: 215, days_left: 0, result_message: 'V01D 멤버들이 감사 인사를 전해왔어요! 감사합니다 💜' },
    { id: 'sup-3', status: 'expired', current_pt: 8000, target_pt: 20000, participants: 45, days_left: 0, result_message: null },
    { id: 'sup-4', status: 'achieved', current_pt: 5200, target_pt: 5000, participants: 89, days_left: 0, result_message: null },
  ],
  allActive: [
    { id: 'sup-1', status: 'active', current_pt: 10500, target_pt: 15000, participants: 128, days_left: 5, result_message: null },
    { id: 'sup-2', status: 'active', current_pt: 18000, target_pt: 30000, participants: 215, days_left: 12, result_message: null },
    { id: 'sup-3', status: 'active', current_pt: 2000, target_pt: 20000, participants: 20, days_left: 20, result_message: null },
    { id: 'sup-4', status: 'active', current_pt: 4800, target_pt: 5000, participants: 89, days_left: 2, result_message: null },
  ],
  achievedExecuting: [
    { id: 'sup-1', status: 'achieved', current_pt: 15000, target_pt: 15000, participants: 180, days_left: 0, result_message: null },
    { id: 'sup-2', status: 'achieved', current_pt: 30500, target_pt: 30000, participants: 250, days_left: 0, result_message: null },
    { id: 'sup-3', status: 'executing', current_pt: 20000, target_pt: 20000, participants: 100, days_left: 0, result_message: null },
    { id: 'sup-4', status: 'executing', current_pt: 5200, target_pt: 5000, participants: 89, days_left: 0, result_message: null },
  ],
  allCompleted: [
    { id: 'sup-1', status: 'completed', current_pt: 15000, target_pt: 15000, participants: 180, days_left: 0, result_message: '커피차 서포트 성공! 멤버들이 감동했어요 ☕💜' },
    { id: 'sup-2', status: 'completed', current_pt: 32000, target_pt: 30000, participants: 215, days_left: 0, result_message: 'V01D 멤버들이 감사 인사를 전해왔어요! 감사합니다 💜' },
    { id: 'sup-3', status: 'completed', current_pt: 20000, target_pt: 20000, participants: 100, days_left: 0, result_message: '버스 광고 집행 완료! 멋진 광고가 되었어요 🚌' },
    { id: 'sup-4', status: 'completed', current_pt: 5200, target_pt: 5000, participants: 89, days_left: 0, result_message: '도시락 서포트 완료! 감사합니다 🍱' },
  ],
  expiredCancelled: [
    { id: 'sup-1', status: 'expired', current_pt: 5000, target_pt: 15000, participants: 30, days_left: 0, result_message: null },
    { id: 'sup-2', status: 'expired', current_pt: 12000, target_pt: 30000, participants: 80, days_left: 0, result_message: null },
    { id: 'sup-3', status: 'cancelled', current_pt: 20000, target_pt: 20000, participants: 100, days_left: 0, result_message: null },
    { id: 'sup-4', status: 'cancelled', current_pt: 5200, target_pt: 5000, participants: 89, days_left: 0, result_message: null },
  ],
};

export type SupportPreset = keyof typeof PRESETS;

export const SUPPORT_PRESET_OPTIONS = [
  { key: 'mixed', label: '혼합' },
  { key: 'allActive', label: '전체 모집중' },
  { key: 'achievedExecuting', label: '달성+집행중' },
  { key: 'allCompleted', label: '전체 완료' },
  { key: 'expiredCancelled', label: '미달성+취소' },
  { key: 'guest', label: '비로그인' },
];

export async function applySupportPreset(preset: SupportPreset, queryClient: QueryClient) {
  const data = PRESETS[preset];

  for (const item of data) {
    await supabase
      .from('support_events')
      .update({
        status: item.status,
        current_pt: item.current_pt,
        target_pt: item.target_pt,
        participants: item.participants,
        days_left: item.days_left,
        result_message: item.result_message,
      })
      .eq('id', item.id);
  }

  queryClient.invalidateQueries({ queryKey: ['support-events'] });
}
