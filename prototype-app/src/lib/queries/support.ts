import { supabase } from '@/lib/supabase';
import type { SupportEvent } from '@/lib/types';

export async function fetchSupportEvents(artistId: string, userId: string): Promise<SupportEvent[]> {
  const { data: events, error } = await supabase
    .from('support_events')
    .select('*')
    .eq('artist_id', artistId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Fetch user investments
  const eventIds = (events ?? []).map((e) => e.id);
  const { data: investments } = await supabase
    .from('user_support_investments')
    .select('event_id, amount')
    .eq('user_id', userId)
    .in('event_id', eventIds.length > 0 ? eventIds : ['__none__']);

  const investMap = new Map<string, number>();
  for (const inv of investments ?? []) {
    investMap.set(inv.event_id, (investMap.get(inv.event_id) ?? 0) + inv.amount);
  }

  // Fetch result images
  const { data: images } = await supabase
    .from('support_event_images')
    .select('event_id, image_url, sort_order')
    .in('event_id', eventIds.length > 0 ? eventIds : ['__none__'])
    .order('sort_order');

  const imageMap = new Map<string, string[]>();
  for (const img of images ?? []) {
    const arr = imageMap.get(img.event_id) ?? [];
    arr.push(img.image_url);
    imageMap.set(img.event_id, arr);
  }

  return (events ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    icon: e.icon,
    status: e.status as SupportEvent['status'],
    targetPt: e.target_pt,
    currentPt: e.current_pt,
    myInvestPt: investMap.get(e.id) ?? 0,
    participants: e.participants,
    daysLeft: e.days_left,
    description: e.description,
    resultMessage: e.result_message,
    resultImages: imageMap.get(e.id),
  }));
}

export async function investInSupport(userId: string, eventId: string, amount: number) {
  // 1. Record investment
  const { error: invError } = await supabase
    .from('user_support_investments')
    .insert({ user_id: userId, event_id: eventId, amount });
  if (invError) throw invError;

  // 2. Update event current_pt and participants
  const { data: event } = await supabase
    .from('support_events')
    .select('current_pt, participants, target_pt')
    .eq('id', eventId)
    .single();

  if (!event) throw new Error('Event not found');

  // Check if user is first-time participant
  const { data: prevInvestments } = await supabase
    .from('user_support_investments')
    .select('id')
    .eq('user_id', userId)
    .eq('event_id', eventId);

  const isFirstTime = (prevInvestments ?? []).length <= 1;

  const newCurrentPt = event.current_pt + amount;
  const newStatus = newCurrentPt >= event.target_pt ? 'achieved' : undefined;

  await supabase
    .from('support_events')
    .update({
      current_pt: newCurrentPt,
      participants: event.participants + (isFirstTime ? 1 : 0),
      ...(newStatus ? { status: newStatus } : {}),
    })
    .eq('id', eventId);

  // 3. Deduct virtue_held
  const { data: currency } = await supabase
    .from('user_currencies')
    .select('virtue_held')
    .eq('user_id', userId)
    .single();

  if (currency) {
    await supabase
      .from('user_currencies')
      .update({ virtue_held: currency.virtue_held - amount })
      .eq('user_id', userId);
  }

  // 4. Record virtue transaction
  await supabase.from('virtue_transactions').insert({
    user_id: userId,
    amount: -amount,
    type: 'spend',
    source: 'support',
    description: `서포트 응원: ${eventId}`,
  });
}
