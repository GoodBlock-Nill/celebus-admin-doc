import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  nickname: string;
  profileImageUrl: string | null;
}

export interface UserCurrency {
  virtueEarned: number;
  virtueHeld: number;
  gp: number;
  celebPoint: number;
}

export interface UserTickets {
  tickets: number;
}

export async function fetchUser(userId: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('users')
    .select('id, nickname, profile_image_url')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return {
    id: data.id,
    nickname: data.nickname,
    profileImageUrl: data.profile_image_url,
  };
}

export async function fetchUserCurrency(userId: string, artistId: string): Promise<UserCurrency> {
  const { data, error } = await supabase
    .from('user_currencies')
    .select('virtue_earned, virtue_held, gp, celeb_point')
    .eq('user_id', userId)
    .eq('artist_id', artistId)
    .single();

  if (error && error.code === 'PGRST116') {
    return { virtueEarned: 0, virtueHeld: 0, gp: 0, celebPoint: 0 };
  }
  if (error) throw error;
  return {
    virtueEarned: data.virtue_earned,
    virtueHeld: data.virtue_held,
    gp: data.gp,
    celebPoint: data.celeb_point,
  };
}

export async function fetchUserTickets(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('user_tickets')
    .select('tickets')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') return 0;
  if (error) throw error;
  return data.tickets;
}

export async function updateVirtueHeld(userId: string, artistId: string, delta: number) {
  const current = await fetchUserCurrency(userId, artistId);
  const { error } = await supabase
    .from('user_currencies')
    .update({ virtue_held: current.virtueHeld + delta, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('artist_id', artistId);

  if (error) throw error;
}
