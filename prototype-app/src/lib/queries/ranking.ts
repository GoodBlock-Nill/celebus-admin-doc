import { supabase } from '@/lib/supabase';
import type { RankingUser } from '@/lib/types';

export interface Season {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface RankingData {
  topUsers: RankingUser[];
  myRank: number;
  myEarnedPt: number;
  seasonLabel: string;
  seasonDaysLeft: number;
}

export async function fetchSeasons(artistId: string): Promise<Season[]> {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('artist_id', artistId)
    .order('start_date', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((s) => ({
    id: s.id,
    label: s.label,
    startDate: s.start_date,
    endDate: s.end_date,
    isCurrent: s.is_current,
  }));
}

export async function fetchRanking(
  artistId: string,
  seasonId: string,
  userId: string
): Promise<RankingData> {
  // Aggregate virtue_transactions by user for this season
  const { data: txData, error } = await supabase
    .from('virtue_transactions')
    .select('user_id, amount, created_at')
    .eq('artist_id', artistId)
    .eq('season_id', seasonId)
    .eq('type', 'earn')
    .order('created_at');

  if (error) throw error;

  // Aggregate by user: total earned + earliest timestamp of reaching that total
  const userTotals = new Map<string, { earned: number; reachedAt: string }>();
  const runningTotals = new Map<string, number>();

  for (const tx of txData ?? []) {
    const prev = runningTotals.get(tx.user_id) ?? 0;
    const newTotal = prev + tx.amount;
    runningTotals.set(tx.user_id, newTotal);
    userTotals.set(tx.user_id, { earned: newTotal, reachedAt: tx.created_at });
  }

  // Sort: highest earned DESC, then earliest reachedAt ASC (tiebreak)
  const sorted = Array.from(userTotals.entries())
    .sort(([, a], [, b]) => {
      if (b.earned !== a.earned) return b.earned - a.earned;
      return new Date(a.reachedAt).getTime() - new Date(b.reachedAt).getTime();
    });

  // Fetch nicknames
  const userIds = sorted.map(([uid]) => uid);
  const { data: usersData } = await supabase
    .from('users')
    .select('id, nickname')
    .in('id', userIds.length > 0 ? userIds : ['__none__']);

  const nicknameMap = new Map((usersData ?? []).map((u) => [u.id, u.nickname]));

  const topUsers: RankingUser[] = sorted.slice(0, 100).map(([uid, info], idx) => ({
    rank: idx + 1,
    nickname: nicknameMap.get(uid) ?? uid,
    earnedPt: info.earned,
    isMe: uid === userId,
  }));

  const myIdx = sorted.findIndex(([uid]) => uid === userId);
  const myRank = myIdx >= 0 ? myIdx + 1 : 0;
  const myEarnedPt = myIdx >= 0 ? sorted[myIdx][1].earned : 0;

  // Season info
  const { data: seasonData } = await supabase
    .from('seasons')
    .select('label, end_date')
    .eq('id', seasonId)
    .single();

  const endDate = seasonData ? new Date(seasonData.end_date) : new Date();
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return {
    topUsers,
    myRank,
    myEarnedPt,
    seasonLabel: seasonData?.label ?? '',
    seasonDaysLeft: daysLeft,
  };
}

export interface VirtueHistoryItem {
  amount: number;
  type: string;
  source: string;
  description: string;
  createdAt: string;
}

export async function fetchVirtueHistory(
  userId: string,
  artistId: string
): Promise<VirtueHistoryItem[]> {
  const { data, error } = await supabase
    .from('virtue_transactions')
    .select('amount, type, source, description, created_at')
    .eq('user_id', userId)
    .eq('artist_id', artistId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []).map((t) => ({
    amount: t.amount,
    type: t.type,
    source: t.source,
    description: t.description,
    createdAt: t.created_at,
  }));
}
