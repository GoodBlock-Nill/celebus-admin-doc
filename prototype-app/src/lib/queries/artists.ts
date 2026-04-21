import { supabase } from '@/lib/supabase';
import type { Artist } from '@/lib/types';

export async function fetchArtists(): Promise<Artist[]> {
  const { data, error } = await supabase
    .from('artists')
    .select(`
      *,
      artist_members (*)
    `)
    .eq('is_active', true);

  if (error) throw error;

  return (data ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    nameEn: a.name_en,
    logoUrl: a.logo_url,
    backgroundUrl: a.background_url,
    members: (a.artist_members ?? [])
      .sort((x: { sort_order: number }, y: { sort_order: number }) => x.sort_order - y.sort_order)
      .map((m: { id: string; name: string; name_en: string; image_url: string | null }) => ({
        id: m.id,
        name: m.name,
        nameEn: m.name_en,
        imageUrl: m.image_url,
      })),
  }));
}

export async function fetchFollowedArtists(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_artist_follows')
    .select('artist_id')
    .eq('user_id', userId);

  if (error) throw error;
  return (data ?? []).map((d) => d.artist_id);
}

export async function followArtist(userId: string, artistId: string) {
  const { error } = await supabase
    .from('user_artist_follows')
    .insert({ user_id: userId, artist_id: artistId });

  if (error) throw error;
}

export async function unfollowArtist(userId: string, artistId: string) {
  const { error } = await supabase
    .from('user_artist_follows')
    .delete()
    .eq('user_id', userId)
    .eq('artist_id', artistId);

  if (error) throw error;
}
