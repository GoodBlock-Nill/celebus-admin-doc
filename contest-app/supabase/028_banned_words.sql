-- 028: 금칙어(비속어) 관리 — 관리자가 유지하는 DB 금칙어 목록.
-- lib/profanity.ts의 하드코딩 기본 리스트에 병합되어 댓글·팬 업로드·닉네임 검사에 사용된다.
-- 관리자 서버(service_role)만 접근한다(RLS enable + 정책 없음 → 클라이언트 직접 접근 차단).

create table if not exists stage_banned_words (
  word text primary key,
  created_at timestamptz not null default now()
);

alter table stage_banned_words enable row level security;
