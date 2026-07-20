export const PLATFORMS = ["youtube", "tiktok", "x", "instagram", "threads"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const CONTEST_TYPES = ["image", "video"] as const;
export type ContestType = (typeof CONTEST_TYPES)[number];

export const CONTEST_STATUSES = ["draft", "open", "voting", "judging", "announced", "closed"] as const;
export type ContestStatus = (typeof CONTEST_STATUSES)[number];

export const AWARD_TYPES = ["popular", "judge"] as const;
export type AwardType = (typeof AWARD_TYPES)[number];

export const CLAIM_STATUSES = ["none", "claimed", "shipped"] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export interface PrizeItem {
  rank_label: string;   // "인기상 1위" / "인기상 1~3위" (자동 생성)
  name: string;         // "V01D 싸인 앨범"
  image_url?: string | null;
  award_type: AwardType;
  count: number;        // 인원수 (인기상은 순위 구간에서 자동 계산)
  rank_from?: number;   // 인기상 순위 구간 시작
  rank_to?: number;     // 인기상 순위 구간 끝
}

// 보상 항목 번역 (base prizes와 같은 순서로 정렬) — 이름·순위 라벨만
export interface PrizeLocale {
  name?: string;
  rank_label?: string;
}

// 콘테스트 다국어 — ko는 base 컬럼, en·ja만 i18n에 저장
export interface ContestLocale {
  title?: string;
  description?: string;
  rules?: string;
  prize_summary?: string;
  prizes?: PrizeLocale[];
}
export type ContestI18n = Record<string, ContestLocale>;

export interface ContestPublic {
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
  status: Exclude<ContestStatus, "draft">;
  is_featured: boolean;
  banner_order: number | null;
  i18n: ContestI18n;
  submit_start_at: string | null;
  submit_end_at: string | null;
  vote_end_at: string | null;
  announce_at: string | null;
  created_at: string;
}

export interface EntryPublic {
  id: string;
  contest_id: string;
  platform: Platform;
  source_url: string;
  external_id: string;
  title: string;
  description: string;
  handle: string;
  handle_verified: boolean; // 링크의 실제 작성자에서 자동 추출된 핸들인지 (도용 방지)
  vote_count: number;
  disqualified: boolean;
  created_at: string;
  updated_at: string;
  edited: boolean;
  thumbnail_url: string | null;
  oembed_title: string | null;
  oembed_author: string | null;
}

export interface AwardPublic {
  id: string;
  contest_id: string;
  entry_id: string | null;
  handle: string;
  award_type: AwardType;
  award_name: string;
  rank: number | null;
  prize: string;
  claim_status: ClaimStatus;
  created_at: string;
}

// /api/resolve-url 응답
export interface ResolvedUrl {
  platform: Platform;
  externalId: string;
  canonicalUrl: string;
  oembed: {
    thumbnail_url?: string;
    title?: string;
    author_name?: string;
  } | null;
  // 링크에서 자동 확인된 작성자 핸들 — 있으면 출품 핸들로 강제(입력 잠금), null이면 수동 입력(미인증)
  authorHandle: string | null;
  duplicate: boolean;
}
