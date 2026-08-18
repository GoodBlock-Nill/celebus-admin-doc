-- ─────────────────────────────────────────────────────────────
-- 035: 홈 팝업 공지 (관리자 등록·스케줄링 — 사용자 요청)
--   홈 진입 시 표시되는 팝업(이미지·제목·본문·CTA·재노출 정책·기간).
--   config가 아닌 전용 테이블 — 홈 마운트마다 공개 뷰 조회 = 부팅 캐시 없이 즉시 반영.
--   문구는 jsonb {ko,en,ja} — 미입력 언어는 클라이언트에서 한국어 폴백.
-- ─────────────────────────────────────────────────────────────

create table if not exists game_notice (
  id         uuid primary key default gen_random_uuid(),
  enabled    boolean not null default false,
  sort       int not null default 100,               -- 작을수록 먼저
  title      jsonb not null default '{}'::jsonb,     -- {ko,en,ja}
  body       jsonb not null default '{}'::jsonb,
  image_url  text,
  cta_label  jsonb not null default '{}'::jsonb,
  cta_url    text,
  policy     text not null default 'always' check (policy in ('always', 'daily', 'once')),
  starts_at  timestamptz,                            -- null = 즉시
  ends_at    timestamptz,                            -- null = 무기한
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table game_notice enable row level security; -- 직접 접근 차단 (뷰·service_role 경유)

-- 공개 뷰 — 게시 중(enabled + 기간 내)인 공지만 anon 노출 (game_config_public 패턴)
create or replace view game_notice_public as
  select id, title, body, image_url, cta_label, cta_url, policy, sort
  from game_notice
  where enabled
    and (starts_at is null or starts_at <= now())
    and (ends_at   is null or ends_at   >  now())
  order by sort asc, created_at asc;
grant select on game_notice_public to anon, authenticated;

notify pgrst, 'reload schema';
