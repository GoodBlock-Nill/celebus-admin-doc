import { supabase } from '@/lib/supabase';

export interface InfoItem {
  id: string;
  type: 'schedule' | 'news';
  title: string;
  date: string;
  time: string | null;
  location: string | null;
  imageUrl: string | null;
  isExclusive: boolean;
  groupLabel: string | null;
  alarmOn: boolean;
}

export async function fetchInfoItems(artistId: string, userId: string): Promise<InfoItem[]> {
  const { data: items, error } = await supabase
    .from('info_items')
    .select('*')
    .eq('artist_id', artistId)
    .order('date', { ascending: false });

  if (error) throw error;

  const itemIds = (items ?? []).map((i) => i.id);
  const { data: alarms } = await supabase
    .from('user_info_alarms')
    .select('info_item_id, alarm_on')
    .eq('user_id', userId)
    .in('info_item_id', itemIds.length > 0 ? itemIds : ['__none__']);

  const alarmMap = new Map((alarms ?? []).map((a) => [a.info_item_id, a.alarm_on]));

  return (items ?? []).map((item) => ({
    id: item.id,
    type: item.type as InfoItem['type'],
    title: item.title,
    date: item.date,
    time: item.time,
    location: item.location,
    imageUrl: item.image_url,
    isExclusive: item.is_exclusive,
    groupLabel: item.group_label,
    alarmOn: alarmMap.get(item.id) ?? false,
  }));
}

export async function toggleAlarm(userId: string, infoItemId: string, alarmOn: boolean) {
  await supabase.from('user_info_alarms').upsert({
    user_id: userId,
    info_item_id: infoItemId,
    alarm_on: alarmOn,
  });
}
