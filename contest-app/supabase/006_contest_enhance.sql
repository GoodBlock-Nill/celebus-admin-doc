-- ============================================================
-- 패치 006: 콘테스트 강화 — 다국어(i18n) + 메인 캐러셀(is_featured·banner_order) + 스토리지 버킷
-- Supabase SQL Editor에서 실행.
-- ============================================================

-- ── 1. 컬럼 추가 ──────────────────────────────────────────────
alter table contests add column if not exists is_featured boolean not null default false;
alter table contests add column if not exists banner_order int;
-- i18n: {"en": {title, description, rules, prize_summary}, "ja": {...}} — ko는 기존 base 컬럼
alter table contests add column if not exists i18n jsonb not null default '{}';

-- ── 2. 공개 뷰 재생성 (+ is_featured, banner_order, i18n 노출) ──
drop view if exists contests_public;
create view contests_public as
  select id, slug, artist, contest_type, title, description, rules, prize_summary, prizes,
         cover_image_url, status, is_featured, banner_order, i18n,
         submit_start_at, submit_end_at, vote_end_at, announce_at, created_at
  from contests
  where status <> 'draft';
grant select on contests_public to anon, authenticated;

-- ── 3. Storage 버킷: contest-media (커버·상품 이미지 업로드) ──
insert into storage.buckets (id, name, public)
values ('contest-media', 'contest-media', true)
on conflict (id) do update set public = true;

-- 정책: 공개 읽기 / 쓰기·수정·삭제는 service_role 전용 (업로드는 서버 라우트가 service_role로 수행)
drop policy if exists "contest-media public read" on storage.objects;
create policy "contest-media public read"
  on storage.objects for select
  using (bucket_id = 'contest-media');

drop policy if exists "contest-media service write" on storage.objects;
create policy "contest-media service write"
  on storage.objects for all
  to service_role
  using (bucket_id = 'contest-media')
  with check (bucket_id = 'contest-media');
