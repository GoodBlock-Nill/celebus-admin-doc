import { supabase } from '@/lib/supabase';
import type { QueryClient } from '@tanstack/react-query';
import { TEST_USER_ID } from '@/lib/constants';

export const QUEST_PRESET_OPTIONS = [
  { key: 'ch1', label: '1장 진행' },
  { key: 'ch2', label: '2장 진행' },
  { key: 'ch3', label: '3장 진행' },
  { key: 'rejected', label: '반려 상태' },
  { key: 'allCleared', label: '전체 완료 (굿즈 미수령)' },
  { key: 'complete', label: '스토리 완료' },
];

const MISSION_IDS = [
  ['m1-1', 'm1-2', 'm1-3'],
  ['m2-1', 'm2-2', 'm2-3'],
  ['m3-1', 'm3-2', 'm3-3'],
  ['m4-1', 'm4-2', 'm4-3'],
  ['m5-1', 'm5-2', 'm5-3'],
];

const CHAPTER_IDS = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5'];

async function clearAllProgress() {
  await supabase.from('user_quest_progress').delete().eq('user_id', TEST_USER_ID);
  await supabase.from('user_chapter_goods').delete().eq('user_id', TEST_USER_ID);
}

async function setMissionStatus(missionId: string, status: string, rejectCode?: string) {
  await supabase.from('user_quest_progress').upsert({
    user_id: TEST_USER_ID,
    mission_id: missionId,
    status,
    submitted_at: status !== 'INCOMPLETE' ? new Date().toISOString() : null,
    reviewed_at: ['APPROVED', 'REJECTED', 'AUTO_COMPLETED'].includes(status) ? new Date().toISOString() : null,
    reject_reason_code: rejectCode ?? null,
  });
}

async function setChapterGoods(chapterId: string, claimed: boolean) {
  await supabase.from('user_chapter_goods').upsert({
    user_id: TEST_USER_ID,
    chapter_id: chapterId,
    claimed,
    claimed_at: claimed ? new Date().toISOString() : null,
  });
}

export async function applyQuestPreset(preset: string, queryClient: QueryClient) {
  await clearAllProgress();

  if (preset === 'ch1') {
    await setMissionStatus('m1-1', 'APPROVED');
    await setMissionStatus('m1-2', 'SUBMITTED');
    await setMissionStatus('m1-3', 'INCOMPLETE');
  } else if (preset === 'ch2') {
    for (const mid of MISSION_IDS[0]) await setMissionStatus(mid, 'APPROVED');
    await setChapterGoods('ch1', true);
    await setMissionStatus('m2-1', 'APPROVED');
    await setMissionStatus('m2-2', 'SUBMITTED');
    await setMissionStatus('m2-3', 'INCOMPLETE');
  } else if (preset === 'ch3') {
    for (const mid of [...MISSION_IDS[0], ...MISSION_IDS[1]]) await setMissionStatus(mid, 'APPROVED');
    await setChapterGoods('ch1', true);
    await setChapterGoods('ch2', true);
    await setMissionStatus('m3-1', 'AUTO_COMPLETED');
    await setMissionStatus('m3-2', 'INCOMPLETE');
    await setMissionStatus('m3-3', 'INCOMPLETE');
  } else if (preset === 'rejected') {
    await setMissionStatus('m1-1', 'APPROVED');
    await setMissionStatus('m1-2', 'REJECTED', 'IMG_BLUR');
    await setMissionStatus('m1-3', 'INCOMPLETE');
  } else if (preset === 'allCleared') {
    for (const chMissions of MISSION_IDS) {
      for (const mid of chMissions) {
        const isAuto = mid.startsWith('m3-') || mid.startsWith('m4-');
        await setMissionStatus(mid, isAuto ? 'AUTO_COMPLETED' : 'APPROVED');
      }
    }
    for (let i = 0; i < 4; i++) await setChapterGoods(CHAPTER_IDS[i], true);
    // ch5 goods not claimed
  } else if (preset === 'complete') {
    for (const chMissions of MISSION_IDS) {
      for (const mid of chMissions) {
        const isAuto = mid.startsWith('m3-') || mid.startsWith('m4-');
        await setMissionStatus(mid, isAuto ? 'AUTO_COMPLETED' : 'APPROVED');
      }
    }
    for (const cid of CHAPTER_IDS) await setChapterGoods(cid, true);
  }

  queryClient.invalidateQueries({ queryKey: ['quest-chapters'] });
}
