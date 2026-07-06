-- ============================================================
-- 패치 005: 관리자 활동 로그 (감사 추적)
-- Supabase SQL Editor에서 실행. (로깅은 best-effort — 미실행 시 로그만 비어 있음)
-- ============================================================

create table if not exists admin_logs (
  id          uuid primary key default gen_random_uuid(),
  action      text not null,                       -- hide/unhide/delete/curate/pin/status/reply/draw/prize_create/prize_ship/prize_delete
  target_type text not null default 'post',         -- post | prize
  target_id   uuid,
  detail      text,                                 -- 사람이 읽는 요약 (예: "채택 ON", "실현상태=실현됨")
  created_at  timestamptz not null default now()
);
create index if not exists admin_logs_idx on admin_logs (created_at desc);

alter table admin_logs enable row level security;    -- 정책 없음 => 서버(service_role)만 접근
