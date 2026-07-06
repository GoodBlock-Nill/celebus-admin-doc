export const TARGETS = ["전체", "V01D", "CELEBUS", "ix"] as const;
export type Target = (typeof TARGETS)[number];

export const IMPL_STATUSES = ["none", "reviewing", "planned", "realized"] as const;
export type ImplStatus = (typeof IMPL_STATUSES)[number];

export interface PostPublic {
  id: string;
  target: Target;
  title: string;
  nickname: string;
  body: string;
  like_count: number;
  created_at: string;
  updated_at: string;
  edited: boolean;
  curated: boolean;
  pinned: boolean;
  impl_status: ImplStatus;
  official_reply: string | null;
}

export const PRIZE_TYPES = ["curated", "raffle"] as const;
export type PrizeType = (typeof PRIZE_TYPES)[number];

export const CLAIM_STATUSES = ["none", "claimed", "shipped"] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export interface PrizePublic {
  id: string;
  post_id: string | null;
  nickname: string;
  type: PrizeType;
  prize: string;
  round: string;
  claim_status: ClaimStatus;
  created_at: string;
}
