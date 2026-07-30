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

// 스테이지 (W1) — 관리자가 생성하는 공연 단위 컨테이너. 유저는 스테이지에 영상 업로드.
export interface StagePublic {
  id: string;
  title: string;
  description: string;
  cover_url: string | null;
  event_date: string | null;
  status: "open" | "archived";
  post_count: number;
  sort_order: number;
  created_at: string;
  is_official: boolean;
}

// 스테이지 게시물 — stage_posts_public 뷰
export const STAGE_CATEGORY_KEYS = ["fancam", "cover", "edit", "etc"] as const;
// 공식 영상 카테고리 — V01D 공식 채널 플레이리스트 기준(공식 아카이브 전용)
export const OFFICIAL_CATEGORY_KEYS = ["v1de0", "album01", "oncam", "log", "azit", "stud10", "outv", "liveclip", "shorts"] as const;
export type StageCategory = (typeof STAGE_CATEGORY_KEYS)[number] | (typeof OFFICIAL_CATEGORY_KEYS)[number];

export interface StagePostPublic {
  id: string;
  stage_id: string;
  platform: Platform;
  source_url: string;
  external_id: string;
  title: string;
  description: string;
  handle: string;
  handle_verified: boolean;
  category: StageCategory;
  like_count: number;
  created_at: string;
  edited: boolean;
  thumbnail_url: string | null;
  oembed_title: string | null;
  oembed_author: string | null;
  view_count: number;
  is_official: boolean;
  featured: boolean;
  uploader_nickname: string | null;
}

// EntryEmbed(임베드 렌더러) 재사용을 위한 어댑터 — 스테이지 게시물을 EntryPublic 형태로
export function stagePostAsEntry(p: StagePostPublic): EntryPublic {
  return {
    id: p.id,
    contest_id: "",
    platform: p.platform,
    source_url: p.source_url,
    external_id: p.external_id,
    title: p.title,
    description: p.description,
    handle: p.handle,
    handle_verified: p.handle_verified,
    vote_count: p.like_count,
    disqualified: false,
    created_at: p.created_at,
    updated_at: p.created_at,
    edited: p.edited,
    thumbnail_url: p.thumbnail_url,
    oembed_title: p.oembed_title,
    oembed_author: p.oembed_author,
  };
}


// 멤버 하트 (W2) — member_hearts_public 뷰
export interface MemberHeartPublic {
  post_id: string;
  member_id: string;
  display_name: string;
  avatar_url: string | null;
  sort_order: number;
  created_at: string;
}

// 댓글 (W2) — stage_comments_public 뷰
export interface StageCommentPublic {
  id: string;
  post_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  is_member: boolean;
  member_name: string | null;
  member_avatar: string | null;
  fan_label: string;
}


// 월드컵 이벤트 (W3) — stage_events_public 뷰
export interface StageEventPublic {
  id: string;
  stage_id: string;
  stage_title: string;
  title: string;
  description: string;
  status: "open" | "announced";
  ends_at: string | null;
  awards: {
    fan: { post_id: string; title: string; handle: string } | null;
    artist: { post_id: string; title: string; handle: string; picks: number } | null;
    uploader: { handle: string; days: number } | null;
  } | null;
  created_at: string;
}

// 월드컵 집계 — worldcup_stats_public 뷰
export interface WorldcupStatPublic {
  event_id: string;
  post_id: string;
  runs_appeared: number;
  final_wins: number;
  match_wins: number;
  match_losses: number;
  win_rate: number;
  match_rate: number;
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
