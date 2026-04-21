import { supabase } from '@/lib/supabase';

export interface Raffle {
  id: string;
  title: string;
  prizeName: string;
  prizeImage: string | null;
  ticketCost: number;
  totalEntries: number;
  status: 'active' | 'drawing' | 'closed';
  endDate: string | null;
  myEntries: number;
  myResult: 'pending' | 'winner' | 'loser' | null;
}

export async function fetchRaffles(artistId: string, userId: string): Promise<Raffle[]> {
  const { data: raffles, error } = await supabase
    .from('raffles')
    .select('*')
    .eq('artist_id', artistId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const raffleIds = (raffles ?? []).map((r) => r.id);
  const { data: entries } = await supabase
    .from('user_raffle_entries')
    .select('raffle_id, entries, result')
    .eq('user_id', userId)
    .in('raffle_id', raffleIds.length > 0 ? raffleIds : ['__none__']);

  const entryMap = new Map(
    (entries ?? []).map((e) => [e.raffle_id, { entries: e.entries, result: e.result }])
  );

  return (raffles ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    prizeName: r.prize_name,
    prizeImage: r.prize_image,
    ticketCost: r.ticket_cost,
    totalEntries: r.total_entries,
    status: r.status as Raffle['status'],
    endDate: r.end_date,
    myEntries: entryMap.get(r.id)?.entries ?? 0,
    myResult: (entryMap.get(r.id)?.result as Raffle['myResult']) ?? null,
  }));
}

export async function enterRaffle(userId: string, raffleId: string, ticketCount: number) {
  const { data: existing } = await supabase
    .from('user_raffle_entries')
    .select('id, entries')
    .eq('user_id', userId)
    .eq('raffle_id', raffleId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('user_raffle_entries')
      .update({ entries: existing.entries + ticketCount })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('user_raffle_entries')
      .insert({ user_id: userId, raffle_id: raffleId, entries: ticketCount });
  }

  // Deduct tickets
  const { data: ticketData } = await supabase
    .from('user_tickets')
    .select('tickets')
    .eq('user_id', userId)
    .single();

  if (ticketData) {
    await supabase
      .from('user_tickets')
      .update({ tickets: ticketData.tickets - ticketCount })
      .eq('user_id', userId);
  }

  // Update raffle total
  const { data: raffle } = await supabase
    .from('raffles')
    .select('total_entries')
    .eq('id', raffleId)
    .single();

  if (raffle) {
    await supabase
      .from('raffles')
      .update({ total_entries: raffle.total_entries + ticketCount })
      .eq('id', raffleId);
  }
}
