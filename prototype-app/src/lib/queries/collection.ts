import { supabase } from '@/lib/supabase';

export interface BiveItem {
  id: string;
  name: string;
  grade: string;
  category: 'artist' | 'event' | 'special';
  imageUrl: string | null;
  howToGet: string | null;
  owned: boolean;
}

export async function fetchBiveItems(artistId: string, userId: string): Promise<BiveItem[]> {
  const { data: items, error } = await supabase
    .from('bive_items')
    .select('*')
    .eq('artist_id', artistId)
    .order('sort_order');

  if (error) throw error;

  const { data: owned } = await supabase
    .from('user_bive_collection')
    .select('bive_id')
    .eq('user_id', userId);

  const ownedSet = new Set((owned ?? []).map((o) => o.bive_id));

  return (items ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    grade: item.grade,
    category: item.category as BiveItem['category'],
    imageUrl: item.image_url,
    howToGet: item.how_to_get,
    owned: ownedSet.has(item.id),
  }));
}
