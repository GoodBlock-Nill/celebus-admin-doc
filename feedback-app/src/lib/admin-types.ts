import type { Target, ImplStatus, PrizeType, ClaimStatus } from "./types";

export interface AdminPost {
  id: string;
  target: Target;
  title: string;
  nickname: string;
  body: string;
  like_count: number;
  report_count: number;
  hidden: boolean;
  created_at: string;
  curated: boolean;
  pinned: boolean;
  impl_status: ImplStatus;
  official_reply: string | null;
}

export interface ClaimInfo {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  memo?: string;
}

export interface AdminPrize {
  id: string;
  post_id: string | null;
  nickname: string;
  type: PrizeType;
  prize: string;
  round: string;
  claim_status: ClaimStatus;
  claim_info: ClaimInfo | null;
  created_at: string;
  claimed_at: string | null;
}

export interface AdminLog {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  detail: string | null;
  created_at: string;
}

export interface AdminStats {
  total: number;
  today: number;
  reported: number;
  hidden: number;
  curated: number;
  prizeTotal: number;
  shippingPending: number;
  commentsReported: number;
}

export interface AdminComment {
  id: string;
  post_id: string;
  nickname: string;
  body: string;
  like_count: number;
  report_count: number;
  hidden: boolean;
  is_op: boolean;
  pinned: boolean;
  created_at: string;
}

export type PostStatusFilter = "all" | "reported" | "hidden" | "curated" | "pinned" | "candidates";
export type PostSort = "recent" | "reported" | "likes";
