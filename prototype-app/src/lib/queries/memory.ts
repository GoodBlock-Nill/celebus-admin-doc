import { supabase } from '@/lib/supabase';

export interface Memory {
  id: string;
  userId: string;
  artistId: string;
  emojis: string[];
  emojiLabels: string[];
  date: string;
  text: string | null;
  location: string | null;
  isPublic: boolean;
  images: string[];
  createdAt: string;
}

export async function fetchMemories(
  userId: string,
  artistId: string,
  year?: number,
  month?: number
): Promise<Memory[]> {
  let query = supabase
    .from('memories')
    .select(`*, memory_images (image_url, sort_order)`)
    .eq('user_id', userId)
    .eq('artist_id', artistId)
    .order('date', { ascending: false });

  if (year && month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
    query = query.gte('date', startDate).lt('date', endDate);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map(mapMemory);
}

export async function fetchMemoryById(memoryId: string): Promise<Memory> {
  const { data, error } = await supabase
    .from('memories')
    .select(`*, memory_images (image_url, sort_order)`)
    .eq('id', memoryId)
    .single();

  if (error) throw error;
  return mapMemory(data);
}

export async function createMemory(params: {
  userId: string;
  artistId: string;
  emojis: string[];
  emojiLabels: string[];
  date: string;
  text?: string;
  location?: string;
  isPublic: boolean;
  imageUrls?: string[];
}) {
  const memoryId = `mem-${Date.now()}`;

  const { error } = await supabase.from('memories').insert({
    id: memoryId,
    user_id: params.userId,
    artist_id: params.artistId,
    emojis: params.emojis,
    emoji_labels: params.emojiLabels,
    date: params.date,
    text: params.text ?? null,
    location: params.location ?? null,
    is_public: params.isPublic,
  });
  if (error) throw error;

  if (params.imageUrls?.length) {
    const imageRows = params.imageUrls.map((url, idx) => ({
      memory_id: memoryId,
      image_url: url,
      sort_order: idx,
    }));
    await supabase.from('memory_images').insert(imageRows);
  }

  // Virtue reward (v5.0: T3 고관여 75DUK)
  await supabase.from('virtue_transactions').insert({
    user_id: params.userId,
    artist_id: params.artistId,
    amount: 75,
    type: 'earn',
    source: 'memory',
    description: '기억 작성',
  });

  return memoryId;
}

export async function updateMemory(
  memoryId: string,
  params: {
    emojis?: string[];
    emojiLabels?: string[];
    text?: string;
    location?: string;
    isPublic?: boolean;
  }
) {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (params.emojis !== undefined) updates.emojis = params.emojis;
  if (params.emojiLabels !== undefined) updates.emoji_labels = params.emojiLabels;
  if (params.text !== undefined) updates.text = params.text;
  if (params.location !== undefined) updates.location = params.location;
  if (params.isPublic !== undefined) updates.is_public = params.isPublic;

  await supabase.from('memories').update(updates).eq('id', memoryId);
}

export async function deleteMemory(memoryId: string) {
  await supabase.from('memories').delete().eq('id', memoryId);
}

export async function getMonthlyMemoryCount(
  userId: string,
  artistId: string
): Promise<number> {
  const now = new Date();
  const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const nextMonth = now.getMonth() === 11 ? 0 : now.getMonth() + 1;
  const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
  const endDate = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-01`;

  const { count, error } = await supabase
    .from('memories')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('artist_id', artistId)
    .gte('date', startDate)
    .lt('date', endDate);

  if (error) throw error;
  return count ?? 0;
}

function mapMemory(row: {
  id: string;
  user_id: string;
  artist_id: string;
  emojis: string[];
  emoji_labels: string[];
  date: string;
  text: string | null;
  location: string | null;
  is_public: boolean;
  created_at: string;
  memory_images?: { image_url: string; sort_order: number }[];
}): Memory {
  return {
    id: row.id,
    userId: row.user_id,
    artistId: row.artist_id,
    emojis: row.emojis ?? [],
    emojiLabels: row.emoji_labels ?? [],
    date: row.date,
    text: row.text,
    location: row.location,
    isPublic: row.is_public,
    images: (row.memory_images ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((img) => img.image_url),
    createdAt: row.created_at,
  };
}
