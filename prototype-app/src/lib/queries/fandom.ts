import { supabase } from '@/lib/supabase';
import type { FandomLevelState, FandomLevelReward } from '@/lib/types';

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
