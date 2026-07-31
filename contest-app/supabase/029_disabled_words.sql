-- 029: 내장 금칙어 비활성화 — 운영자가 코드 내장 기본 금칙어 중 오탐(false positive) 우려 단어를
-- 개별 비활성화. checkProfanity가 이 목록의 단어는 내장 검사에서 제외한다.
-- 관리자 서버(service_role)만 접근(RLS enable + 정책 없음).

create table if not exists stage_disabled_words (
  word text primary key,
  created_at timestamptz not null default now()
);

alter table stage_disabled_words enable row level security;
