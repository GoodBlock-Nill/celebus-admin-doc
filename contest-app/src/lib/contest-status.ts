import type { ContestPublic, ContestStatus } from "./types";

export const STATUS_LABELS: Record<ContestStatus, string> = {
  draft: "준비중",
  open: "접수중",
  voting: "투표중",
  judging: "심사중",
  announced: "발표",
  closed: "종료",
};

export const STATUS_COLORS: Record<ContestStatus, string> = {
  draft: "bg-white/10 text-muted",
  open: "bg-emerald-500/15 text-emerald-400",
  voting: "bg-primary/20 text-primary-400",
  judging: "bg-amber-400/15 text-amber-300",
  announced: "bg-accent/15 text-accent",
  closed: "bg-white/10 text-muted",
};

// 현재 상태에서 카운트다운 대상 — 히어로 D-day 칩·카피 자동 전환용.
// 현재 유효한(미래) 창만 반환: 접수 진행 중이면 접수 마감, 접수 마감 후 투표 진행 중이면 투표 마감.
export function ddayTarget(c: ContestPublic, now = new Date()): { labelKey: string; at: string } | null {
  if (c.status === "open" && c.submit_end_at && now < new Date(c.submit_end_at))
    return { labelKey: "dday_submit", at: c.submit_end_at };
  if ((c.status === "open" || c.status === "voting") && c.vote_end_at && now < new Date(c.vote_end_at))
    return { labelKey: "dday_vote", at: c.vote_end_at };
  if (c.status === "judging" && c.announce_at && now < new Date(c.announce_at))
    return { labelKey: "dday_announce", at: c.announce_at };
  return null;
}

export function canSubmit(c: ContestPublic, now = new Date()): boolean {
  if (c.status !== "open") return false;
  if (c.submit_start_at && now < new Date(c.submit_start_at)) return false;
  if (c.submit_end_at && now > new Date(c.submit_end_at)) return false;
  return true;
}

export function canVote(c: ContestPublic, now = new Date()): boolean {
  if (c.status !== "open" && c.status !== "voting") return false;
  if (c.vote_end_at && now > new Date(c.vote_end_at)) return false;
  return true;
}

export function canEditEntry(c: ContestPublic): boolean {
  return c.status === "open";
}

// D-day 계산 (KST 자정 아님 — 남은 시간 기준 표기용)
export function remaining(at: string, now = new Date()): { days: number; hours: number; mins: number; over: boolean } {
  const diff = new Date(at).getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, mins: 0, over: true };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return { days, hours, mins, over: false };
}
