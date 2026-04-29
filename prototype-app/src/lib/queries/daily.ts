import { supabase } from '@/lib/supabase';
import type { DailyMission, StreakBonus } from '@/lib/types';

export interface DailyState {
  checkedIn: boolean;
  mission: DailyMission | null;
  streak: number;
  weekRecord: boolean[];
  bonuses: StreakBonus[];
}

export async function fetchDailyState(userId: string, artistId: string): Promise<DailyState> {
  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().getDay();
  const missionIndex = dayOfWeek % 8;

  // 1. Check-in status
  const { data: checkinData } = await supabase
    .from('user_daily_checkins')
    .select('checkin_date')
    .eq('user_id', userId)
    .eq('artist_id', artistId)
    .eq('checkin_date', today)
    .maybeSingle();

  // 2. Today's mission
  const { data: missionPool } = await supabase
    .from('daily_mission_pool')
    .select('*')
    .eq('is_active', true)
    .order('id');

  const todayMissionRow = missionPool?.[missionIndex] ?? missionPool?.[0];

  const { data: missionCompletion } = await supabase
    .from('user_daily_missions')
    .select('completed')
    .eq('user_id', userId)
    .eq('artist_id', artistId)
    .eq('mission_date', today)
    .maybeSingle();

  // 3. Streak
  const { data: streakData } = await supabase
    .from('user_streaks')
    .select('current_streak, last_checkin_date')
    .eq('user_id', userId)
    .eq('artist_id', artistId)
    .maybeSingle();

  // 4. Week record (Mon-Sun)
  const now = new Date();
  const mondayOffset = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const { data: weekCheckins } = await supabase
    .from('user_daily_checkins')
    .select('checkin_date')
    .eq('user_id', userId)
    .eq('artist_id', artistId)
    .in('checkin_date', weekDates);

  const checkinDates = new Set((weekCheckins ?? []).map((c) => c.checkin_date));
  const weekRecord = weekDates.map((d) => checkinDates.has(d));

  // 5. Bonuses
  const { data: bonusData } = await supabase
    .from('user_streak_bonuses')
    .select('days_milestone, reward_pt, claimed')
    .eq('user_id', userId)
    .eq('artist_id', artistId)
    .order('days_milestone');

  const mission: DailyMission | null = todayMissionRow
    ? {
        id: todayMissionRow.id,
        title: todayMissionRow.title,
        description: todayMissionRow.description,
        targetHref: todayMissionRow.target_href,
        rewardPt: todayMissionRow.reward_pt,
        completed: missionCompletion?.completed ?? false,
      }
    : null;

  return {
    checkedIn: !!checkinData,
    mission,
    streak: streakData?.current_streak ?? 0,
    weekRecord,
    bonuses: (bonusData ?? []).map((b) => ({
      days: b.days_milestone,
      rewardPt: b.reward_pt,
      claimed: b.claimed,
    })),
  };
}

export async function performCheckin(userId: string, artistId: string) {
  const today = new Date().toISOString().split('T')[0];

  const { error: checkinError } = await supabase
    .from('user_daily_checkins')
    .insert({ user_id: userId, artist_id: artistId, checkin_date: today });
  if (checkinError) throw checkinError;

  // Update streak
  const { data: streakData } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .eq('artist_id', artistId)
    .maybeSingle();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const isConsecutive = streakData?.last_checkin_date === yesterdayStr;
  const newStreak = isConsecutive ? (streakData?.current_streak ?? 0) + 1 : 1;

  await supabase
    .from('user_streaks')
    .upsert({
      user_id: userId,
      artist_id: artistId,
      current_streak: newStreak,
      last_checkin_date: today,
    });

  // Add virtue transaction (v5.0: T1 즉시·습관 5DUK)
  await supabase.from('virtue_transactions').insert({
    user_id: userId,
    artist_id: artistId,
    amount: 5,
    type: 'earn',
    source: 'checkin',
    description: '출석 체크',
  });
}

export async function completeDailyMission(userId: string, artistId: string, missionId: string) {
  const today = new Date().toISOString().split('T')[0];

  await supabase.from('user_daily_missions').upsert({
    user_id: userId,
    artist_id: artistId,
    mission_id: missionId,
    mission_date: today,
    completed: true,
    completed_at: new Date().toISOString(),
  });

  // v5.1: 일일 미션 일괄 지급 25DUK (T2 저관여)
  await supabase.from('virtue_transactions').insert({
    user_id: userId,
    artist_id: artistId,
    amount: 25,
    type: 'earn',
    source: 'mission',
    description: '일일 미션 완료',
  });
}

export async function claimStreakBonus(userId: string, artistId: string, daysMilestone: number) {
  const { error } = await supabase
    .from('user_streak_bonuses')
    .update({ claimed: true, claimed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('artist_id', artistId)
    .eq('days_milestone', daysMilestone);

  if (error) throw error;
}
