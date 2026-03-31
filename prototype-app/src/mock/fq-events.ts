import type { EventHistoryItem } from '@/lib/fq-types';

export const mockEventHistory: EventHistoryItem[] = [
  { id: 'ev-01', type: 'QUEST', artistName: 'V01D', title: 'V01D 팬레터 작성', datetime: '2026-04-08T09:00:00Z', questStatus: 'COMPLETED', rewardTickets: 2 },
  { id: 'ev-02', type: 'RAFFLE', artistName: 'V01D', title: 'V01D 사인 포토카드 4월 추첨', datetime: '2026-04-06T09:00:00Z', raffleStatus: 'ACTIVE', ticketsUsed: 8, raffleId: 'raffle-001' },
  { id: 'ev-03', type: 'QUEST', artistName: 'V01D', title: 'V01D 응원 SNS 게시 인증', datetime: '2026-04-12T10:00:00Z', questStatus: 'REJECTED', rejectionCode: 'IMG_BLUR' },
  { id: 'ev-04', type: 'QUEST', artistName: 'V01D', title: 'Tug of War 스트리밍 인증', datetime: '2026-04-15T14:30:00Z', questStatus: 'PENDING' },
  { id: 'ev-05', type: 'RAFFLE', artistName: 'V01D', title: 'V01D [01] 사인 앨범 추첨', datetime: '2026-03-25T10:00:00Z', raffleStatus: 'WON', ticketsUsed: 5, raffleId: 'raffle-003' },
  { id: 'ev-06', type: 'RAFFLE', artistName: 'V01D', title: 'V01D 팬싸 참가권 추첨', datetime: '2026-04-20T10:00:00Z', raffleStatus: 'CLOSED', ticketsUsed: 0, raffleId: 'raffle-002' },
  { id: 'ev-07', type: 'QUEST', artistName: 'V01D', title: 'V01D 공식 SNS 팔로우 인증', datetime: '2026-04-01T00:00:00Z', questStatus: 'COMPLETED', rewardTickets: 2 },
];
