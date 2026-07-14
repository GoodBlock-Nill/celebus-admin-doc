export const TARGETS = ["전체", "V01D", "CELEBUS"] as const;
export type Target = (typeof TARGETS)[number];

export const CATEGORIES = ["이벤트", "굿즈", "행사", "콘텐츠", "기타"] as const;
export type Category = (typeof CATEGORIES)[number];

export const IMPL_STATUSES = ["none", "reviewing", "planned", "realized"] as const;
export type ImplStatus = (typeof IMPL_STATUSES)[number];

export interface PostPublic {
  id: string;
  target: Target;
  category: Category;
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
  comment_count: number;
  translations: Record<string, { title: string; body: string }>;
}

export interface CommentPublic {
  id: string;
  post_id: string;
  nickname: string;
  body: string;
  like_count: number;
  is_op: boolean;
  pinned: boolean;
  created_at: string;
  updated_at: string;
  edited: boolean;
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
