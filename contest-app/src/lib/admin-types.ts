// 관리자 화면용 raw 테이블 타입 (공개 뷰가 아닌 서비스롤 조회 결과)
import type { AwardType, ClaimStatus, ContestI18n, ContestStatus, ContestType, Platform, PrizeItem } from "./types";

export interface ContestRow {
  id: string;
  slug: string;
  artist: string;
  contest_type: ContestType;
  title: string;
  description: string;
  rules: string;
  prize_summary: string;
  prizes: PrizeItem[];
  cover_image_url: string | null;
  status: ContestStatus;
  is_featured: boolean;
  banner_order: number | null;
  i18n: ContestI18n;
  submit_start_at: string | null;
  submit_end_at: string | null;
  vote_end_at: string | null;
  announce_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EntryRow {
  id: string;
  contest_id: string;
  platform: Platform;
  source_url: string;
  external_id: string;
  title: string;
  description: string;
  handle: string;
  handle_verified: boolean;
  celebus_nickname: string | null; // 서버 전용 — 관리자 화면에서만
  phone: string | null; // 서버 전용 — 관리자 화면에서만
  vote_count: number;
  report_count: number;
  hidden: boolean;
  disqualified: boolean;
  disqualify_reason: string | null;
  created_at: string;
  oembed: { thumbnail_url?: string; title?: string; author_name?: string } | null;
}

export interface AwardRow {
  id: string;
  contest_id: string;
  entry_id: string | null;
  handle: string;
  award_type: AwardType;
  award_name: string;
  rank: number | null;
  prize: string;
  claim_status: ClaimStatus;
  claim_info: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    memo?: string;
    agreed_at?: string;
  } | null;
  created_at: string;
  claimed_at: string | null;
  shipped_at: string | null;
}

export interface LogRow {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  detail: string | null;
  created_at: string;
}

const PW_KEY = "cfs_admin_pw";

export function getAdminPw(): string {
  try {
    return sessionStorage.getItem(PW_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setAdminPw(pw: string): void {
  try {
    sessionStorage.setItem(PW_KEY, pw);
  } catch {
    /* ignore */
  }
}

export async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(path, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      authorization: `Bearer ${getAdminPw()}`,
      ...(init.body ? { "content-type": "application/json" } : {}),
    },
  });
}
