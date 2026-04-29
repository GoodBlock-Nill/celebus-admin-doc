import { supabase } from '@/lib/supabase';
import type { FandomLevelState, FandomLevelReward } from '@/lib/types';

// 팬덤 레벨 카운터 모델: 리셋 모델 (정책 v5.3 / EVT-201 v2.2 기준)
// - 각 레벨에서 카운터 0부터 시작 → target_pt 도달 시 다음 레벨 진입 + 카운터 0 리셋
// - target_pt는 누적값이 아닌 해당 레벨 단독 목표값
// - 진행률 = currentPt / target_pt × 100
export async function fetchFandomLevel(artistId: string, userId: string): Promise<FandomLevelState> {
  // 1. Level config
  const { data: levels } = await supabase
    .from('fandom_levels')
    .select('level, target_pt, reward_name')
    .eq('artist_id', artistId)
    .order('level');

  // 2. Current progress
  const { data: progress } = await supabase
    .from('fandom_level_progress')
    .select('*')
    .eq('artist_id', artistId)
    .maybeSingle();

  // 3. User contribution
  const { data: contribution } = await supabase
    .from('user_fandom_contributions')
    .select('contribution_pt')
    .eq('user_id', userId)
    .eq('artist_id', artistId)
    .maybeSingle();

  const currentLevel = progress?.current_level ?? 1;
  const currentPt = progress?.current_pt ?? 0;
  const maxLevel = levels?.length ?? 5;
  const isMax = currentLevel >= maxLevel;

  const currentLevelConfig = levels?.find((l) => l.level === currentLevel);
  const targetPt = currentLevelConfig?.target_pt ?? 5000;

  const rewards: FandomLevelReward[] = (levels ?? []).map((l) => ({
    level: l.level,
    targetPt: l.target_pt,
    rewardName: l.reward_name,
    unlocked: l.level < currentLevel || (l.level === currentLevel && currentPt >= l.target_pt),
  }));

  return {
    currentLevel,
    currentPt,
    targetPt,
    myContributionPt: contribution?.contribution_pt ?? 0,
    participantCount: progress?.participant_count ?? 0,
    monthlyTotal: progress?.monthly_total ?? 0,
    topActivity: progress?.top_activity ?? '',
    rewards,
    isMax,
  };
}
