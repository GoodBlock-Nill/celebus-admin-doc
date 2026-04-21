import { supabase } from '@/lib/supabase';
import type { QuestChapter, QuestMission, RepeatingQuest } from '@/lib/types';

export async function fetchQuestChapters(userId: string, artistId: string): Promise<QuestChapter[]> {
  const { data: chapters, error: chError } = await supabase
    .from('quest_chapters')
    .select(`
      *,
      quest_missions (
        *,
        quest_mission_links (*)
      )
    `)
    .eq('artist_id', artistId)
    .order('chapter_number');

  if (chError) throw chError;

  // Fetch user progress
  const missionIds = (chapters ?? []).flatMap((ch) =>
    (ch.quest_missions ?? []).map((m: { id: string }) => m.id)
  );

  const { data: progress } = await supabase
    .from('user_quest_progress')
    .select('*')
    .eq('user_id', userId)
    .in('mission_id', missionIds.length > 0 ? missionIds : ['__none__']);

  const progressMap = new Map(
    (progress ?? []).map((p) => [p.mission_id, p])
  );

  // Fetch goods claim status
  const chapterIds = (chapters ?? []).map((ch) => ch.id);
  const { data: goodsData } = await supabase
    .from('user_chapter_goods')
    .select('chapter_id, claimed')
    .eq('user_id', userId)
    .in('chapter_id', chapterIds.length > 0 ? chapterIds : ['__none__']);

  const goodsMap = new Map(
    (goodsData ?? []).map((g) => [g.chapter_id, g.claimed])
  );

  return (chapters ?? []).map((ch, idx) => {
    const missions: QuestMission[] = (ch.quest_missions ?? [])
      .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
      .map((m: { id: string; title: string; type: string; reward_text: string; quest_mission_links: { label: string; url: string }[] }) => {
        const prog = progressMap.get(m.id);
        return {
          id: m.id,
          title: m.title,
          type: m.type as QuestMission['type'],
          status: (prog?.status ?? 'INCOMPLETE') as QuestMission['status'],
          rewardText: m.reward_text,
          rejectReasonCode: prog?.reject_reason_code,
          relatedLinks: (m.quest_mission_links ?? []).map((l) => ({
            label: l.label,
            url: l.url,
          })),
        };
      });

    const allCleared = missions.every(
      (m) => m.status === 'APPROVED' || m.status === 'AUTO_COMPLETED'
    );
    const anySubmitted = missions.some((m) => m.status === 'SUBMITTED');

    // Determine chapter status
    let status: QuestChapter['status'];
    if (allCleared) {
      status = 'cleared';
    } else if (anySubmitted && missions.filter((m) => m.status === 'INCOMPLETE').length === 0) {
      status = 'reviewing';
    } else {
      // Check if previous chapter is cleared
      const prevCleared = idx === 0 || isPreviousCleared(chapters ?? [], idx, progressMap);
      status = prevCleared ? 'active' : 'locked';
    }

    return {
      id: ch.id,
      number: ch.chapter_number,
      title: ch.title,
      description: ch.description,
      status,
      missions,
      goodsName: ch.goods_name,
      goodsGrade: ch.goods_grade,
      goodsClaimed: goodsMap.get(ch.id) ?? false,
      missionHint: '',
    };
  });
}

function isPreviousCleared(
  chapters: { id: string; chapter_number: number; quest_missions: { id: string }[] }[],
  currentIdx: number,
  progressMap: Map<string, { status: string }>
): boolean {
  const prev = chapters[currentIdx - 1];
  if (!prev) return true;
  return (prev.quest_missions ?? []).every((m: { id: string }) => {
    const prog = progressMap.get(m.id);
    return prog?.status === 'APPROVED' || prog?.status === 'AUTO_COMPLETED';
  });
}

export async function submitMission(userId: string, missionId: string, imageUrl?: string) {
  await supabase.from('user_quest_progress').upsert({
    user_id: userId,
    mission_id: missionId,
    status: 'SUBMITTED',
    submitted_at: new Date().toISOString(),
    submission_image_url: imageUrl ?? null,
  });
}

export async function claimChapterGoods(userId: string, chapterId: string) {
  await supabase.from('user_chapter_goods').upsert({
    user_id: userId,
    chapter_id: chapterId,
    claimed: true,
    claimed_at: new Date().toISOString(),
  });
}

export async function fetchRepeatingQuests(artistId: string): Promise<RepeatingQuest[]> {
  const { data, error } = await supabase
    .from('repeating_quests')
    .select('*')
    .eq('artist_id', artistId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((rq) => ({
    id: rq.id,
    title: rq.title,
    period: rq.period_start && rq.period_end
      ? `${rq.period_start.slice(5).replace('-', '.')} ~ ${rq.period_end.slice(5).replace('-', '.')}`
      : '',
    missionCount: rq.mission_count,
    rewardText: rq.reward_text,
    status: rq.status as RepeatingQuest['status'],
  }));
}
