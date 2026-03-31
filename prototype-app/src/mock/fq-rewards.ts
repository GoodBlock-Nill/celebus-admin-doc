import type { RewardItem } from '@/lib/fq-types';

export const mockRewards: RewardItem[] = [
  // TICKET category
  { id: 'r-01', name: '1장 퀘스트 완료 응모권', description: '1장 클리어 보상', category: 'TICKET', rewardType: 'ALWAYS', emoji: '🎫', source: '1장 클리어', claimStatus: 'CLAIMED', claimedAt: '2026-04-03T14:30:00Z' },
  { id: 'r-02', name: '2장 퀘스트 완료 응모권', description: '2장 클리어 보상', category: 'TICKET', rewardType: 'ALWAYS', emoji: '🎫', source: '2장 클리어', claimStatus: 'CLAIMED', claimedAt: '2026-04-05T18:00:00Z' },
  { id: 'r-03', name: '시즌 TOP 10% 보너스 응모권', description: '4월 시즌 슈퍼팬 보상', category: 'TICKET', rewardType: 'ALWAYS', emoji: '🎫', source: '시즌 랭킹', claimStatus: 'CLAIMABLE', claimedAt: null },
  { id: 'r-04', name: '팬덤 Lv.2 달성 응모권', description: '팬덤 레벨업 보상', category: 'TICKET', rewardType: 'ALWAYS', emoji: '🎫', source: '팬덤 Lv.2', claimStatus: 'CLAIMED', claimedAt: '2026-04-12T10:00:00Z' },

  // BADGE_THEME category
  { id: 'r-05', name: '슈퍼팬 뱃지', description: '4월 시즌 TOP 10% 달성 뱃지', category: 'BADGE_THEME', rewardType: 'ALWAYS', emoji: '⭐', source: '시즌 랭킹', claimStatus: 'CLAIMED', claimedAt: '2026-04-15T00:00:00Z' },
  { id: 'r-06', name: 'V01D 탐험가 뱃지', description: '3장 이상 클리어 달성', category: 'BADGE_THEME', rewardType: 'ALWAYS', emoji: '🧭', source: '퀘스트 3장', claimStatus: 'CLAIMABLE', claimedAt: null },
  { id: 'r-07', name: '7일 스트릭 뱃지', description: '7일 연속 접속 달성', category: 'BADGE_THEME', rewardType: 'ALWAYS', emoji: '🔥', source: '출석 스트릭', claimStatus: 'CLAIMED', claimedAt: '2026-04-10T09:00:00Z' },
  { id: 'r-08', name: 'V01D 보라 프로필 프레임', description: 'V01D 테마 프로필 꾸미기', category: 'BADGE_THEME', rewardType: 'ALWAYS', emoji: '💜', source: '팬덤 Lv.2', claimStatus: 'CLAIMABLE', claimedAt: null },
  { id: 'r-09', name: '덕력왕 레전드 뱃지', description: '시즌 1위 전용 뱃지', category: 'BADGE_THEME', rewardType: 'ALWAYS', emoji: '👑', source: '시즌 1위', claimStatus: 'LOCKED', claimedAt: null },

  // CONTENT category
  { id: 'r-10', name: 'V01D 비하인드 사진 3장', description: '3장 클리어 보상 독점 사진', category: 'CONTENT', rewardType: 'ALWAYS', emoji: '📸', source: '3장 클리어', claimStatus: 'CLAIMABLE', claimedAt: null },
  { id: 'r-11', name: 'V01D 연습실 비하인드 클립', description: 'Tug of War 안무 연습 영상', category: 'CONTENT', rewardType: 'ALWAYS', emoji: '🎬', source: '팬덤 Lv.1', claimStatus: 'CLAIMED', claimedAt: '2026-04-08T12:00:00Z' },
  { id: 'r-12', name: '유찬 보이스 메시지', description: '리더 유찬의 팬 감사 메시지', category: 'CONTENT', rewardType: 'ALWAYS', emoji: '🎤', source: '팬덤 Lv.2', claimStatus: 'CLAIMABLE', claimedAt: null },
  { id: 'r-13', name: 'V01D 멤버별 독점 셀카', description: '5장 클리어 시 해금', category: 'CONTENT', rewardType: 'ALWAYS', emoji: '🤳', source: '5장 클리어', claimStatus: 'LOCKED', claimedAt: null },

  // GOODS category
  { id: 'r-14', name: 'V01D 한정판 디지털 포토카드 #1', description: '유찬 ver. 디지털 포카', category: 'GOODS', rewardType: 'ALWAYS', emoji: '🃏', source: '팬덤 Lv.2', claimStatus: 'CLAIMED', claimedAt: '2026-04-12T10:00:00Z' },
  { id: 'r-15', name: 'V01D 한정판 디지털 포토카드 세트', description: '5종 컴플리트 세트', category: 'GOODS', rewardType: 'ALWAYS', emoji: '🃏', source: '팬덤 Lv.3', claimStatus: 'LOCKED', claimedAt: null },
  { id: 'r-16', name: 'V01D 탐험 완료 한정판 포카', description: '5장 전체 클리어 보상', category: 'GOODS', rewardType: 'ALWAYS', emoji: '✨', source: '5장 클리어', claimStatus: 'LOCKED', claimedAt: null },
  { id: 'r-17', name: 'V01D 데뷔 기념 굿즈', description: '데뷔 100일 기념 한정 굿즈', category: 'GOODS', rewardType: 'ALWAYS', emoji: '🎁', source: '기념일 이벤트', claimStatus: 'LOCKED', claimedAt: null },

  // EVENT category
  { id: 'r-18', name: 'V01D 팬싸 참가권 추첨 응모', description: '5장 클리어 유저 전용', category: 'EVENT', rewardType: 'EVENT', emoji: '🎪', source: '5장 클리어', claimStatus: 'LOCKED', claimedAt: null },
  { id: 'r-19', name: 'V01D 콘서트 VIP 추첨', description: '팬덤 Lv.3 달성 시 해금', category: 'EVENT', rewardType: 'EVENT', emoji: '🎤', source: '팬덤 Lv.3', claimStatus: 'LOCKED', claimedAt: null },
  { id: 'r-20', name: 'V01D 영상통화 추첨', description: '팬덤 Lv.4 달성 시 해금', category: 'EVENT', rewardType: 'EVENT', emoji: '📱', source: '팬덤 Lv.4', claimStatus: 'LOCKED', claimedAt: null },
];
