import type { MultiLangText } from './types';

export type QuestStatus = 'Draft' | 'Active' | 'Ended';
export type RaffleStatus = 'Draft' | 'Active' | 'Closed' | 'Ended';
export type RewardType = 'TICKET' | 'TICKET_NFT' | 'NFT';
export type DeliveryType = 'DELIVERY' | 'ONSITE' | 'ONLINE';
export type SubmissionStatus = 'Pending' | 'Approved' | 'Rejected';

export interface RelatedLink {
  label: MultiLangText;
  url: string;
}

export interface Quest {
  id: string;
  title: MultiLangText;
  description: MultiLangText;
  userGuide: MultiLangText;
  thumbnailImage: string;
  artist: string;
  questType: string;
  deadline: string;
  startedAt: string | null;
  rewardType: RewardType;
  ticketCount: number;
  nftEvent: string | null;
  relatedLinks: RelatedLink[];
  status: QuestStatus;
  stats: { total: number; approved: number; rejected: number; pending: number };
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface QuestSubmission {
  id: string;
  questId: string;
  userId: number;
  nickname: string;
  imageUrl: string;
  submittedAt: string;
  status: SubmissionStatus;
  rejectionReason?: string;
  processedAt?: string;
  processedBy?: string;
}

export interface RejectionReason {
  id: string;
  adminLabel: string;
  userMessage: MultiLangText;
  isActive: boolean;
  createdAt: string;
}

export interface Raffle {
  id: string;
  title: MultiLangText;
  description: MultiLangText;
  thumbnailImage: string;
  artist: string;
  winnerCount: number;
  deliveryType: DeliveryType;
  rewardDetail: MultiLangText;
  deliveryGuide: {
    deadline?: string;
    formUrl?: string;
    period?: string;
    hours?: string;
    location?: MultiLangText;
    requirements?: MultiLangText;
  };
  notice: MultiLangText;
  deadline: string;
  startedAt: string | null;
  status: RaffleStatus;
  stats: { totalParticipants: number; totalTickets: number; targetWinners: number; rewardCompleted: number };
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface RaffleEntry {
  id: string;
  raffleId: string;
  userId: number;
  nickname: string;
  phone: string;
  ticketCount: number;
  lastEntryAt: string;
  cumulativeTickets: number;
}

export interface RaffleWinner {
  id: string;
  raffleId: string;
  userId: number;
  nickname: string;
  phone: string;
  cumulativeTickets: number;
  drawnAt: string;
  isWinner: boolean;
  rewardDelivered: boolean;
  note?: string;
}
