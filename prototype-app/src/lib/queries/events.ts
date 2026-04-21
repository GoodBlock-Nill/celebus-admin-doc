import { supabase } from '@/lib/supabase';

export interface EventItem {
  id: string;
  title: string;
  subtitle: string | null;
  type: 'raffle' | 'support' | 'event';
  emoji: string | null;
  dDay: number | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  linkedEntityId: string | null;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkedUrl: string | null;
}

export interface AppNotice {
  id: string;
  title: string;
  date: string;
}

export async function fetchEvents(
  artistId: string,
  filter?: 'active' | 'closing' | 'closed'
): Promise<EventItem[]> {
  let query = supabase
    .from('events')
    .select('*')
    .eq('artist_id', artistId);

  if (filter === 'active') {
    query = query.eq('is_active', true).gt('d_day', 3);
  } else if (filter === 'closing') {
    query = query.eq('is_active', true).lte('d_day', 3).gte('d_day', 0);
  } else if (filter === 'closed') {
    query = query.eq('is_active', false);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;

  return (data ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    subtitle: e.subtitle,
    type: e.type as EventItem['type'],
    emoji: e.emoji,
    dDay: e.d_day,
    isActive: e.is_active,
    startDate: e.start_date,
    endDate: e.end_date,
    linkedEntityId: e.linked_entity_id,
  }));
}

export async function fetchBanners(artistId: string): Promise<Banner[]> {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('artist_id', artistId)
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return (data ?? []).map((b) => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    imageUrl: b.image_url,
    linkedUrl: b.linked_url,
  }));
}

export async function fetchNotices(): Promise<AppNotice[]> {
  const { data, error } = await supabase
    .from('app_notices')
    .select('*')
    .eq('is_active', true)
    .order('date', { ascending: false })
    .limit(5);

  if (error) throw error;
  return (data ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    date: n.date,
  }));
}
