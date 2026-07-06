-- ============================================================
-- 패치 004: 참여 보상 시스템 (채택형 + 추첨 하이브리드)
-- Supabase SQL Editor에서 실행.
--   A. posts 채택/고정/실현상태/공식답글 컬럼 (Phase 1)
--   B. prizes 테이블 + 공개 뷰 (Phase 2)
--   C. 추첨(draw_raffle) · 클레임(submit_claim) RPC
-- ============================================================

-- ---------- A. posts 컬럼 (Phase 1, 비민감) ----------
alter table posts add column if not exists curated        boolean not null default false;  -- 채택(베스트 보이스)
alter table posts add column if not exists pinned         boolean not null default false;  -- 상단 고정
alter table posts add column if not exists impl_status    text    not null default 'none'
     check (impl_status in ('none','reviewing','planned','realized'));                      -- 검토중/반영예정/실현됨
alter table posts add column if not exists official_reply text;                             -- 공식/아티스트 답글

-- 공개 뷰 재정의 (+ 신규 4컬럼). create-or-replace 는 끝에만 컬럼 추가 가능하므로 drop 후 재생성.
drop view if exists posts_public;
create view posts_public as
  select id, target, title, nickname, body, like_count, created_at, updated_at,
         (updated_at > created_at) as edited,
         curated, pinned, impl_status, official_reply
  from posts
  where hidden = false;
grant select on posts_public to anon, authenticated;

-- ---------- B. prizes 테이블 + 공개 뷰 (Phase 2) ----------
create table if not exists prizes (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid references posts(id) on delete set null,
  nickname     text not null,                        -- 발표용(비정규화)
  type         text not null check (type in ('curated','raffle')),
  prize        text not null,                         -- 굿즈 설명 (예: "V01D 사인 포카")
  round        text not null,                         -- 회차/주차 라벨 (예: "2026-W27")
  claim_status text not null default 'none' check (claim_status in ('none','claimed','shipped')),
  claim_info   jsonb,                                 -- 배송지·연락처 (민감 — 서버 전용)
  created_at   timestamptz not null default now(),
  claimed_at   timestamptz
);
create index if not exists prizes_round_idx on prizes (round, created_at desc);

alter table prizes enable row level security;         -- 정책 없음 => anon 직접 접근 전면 차단

-- 공개 뷰: claim_info(배송지) 제외
create or replace view prizes_public as
  select id, post_id, nickname, type, prize, round, claim_status, created_at
  from prizes;
grant select on prizes_public to anon, authenticated;

-- ---------- C. RPC (SECURITY DEFINER, service_role 전용) ----------

-- 추첨: 최근 p_days일 내 hidden=false 글 중, author_hash(솔티드 IP 해시) 1엔트리로 dedup 후 랜덤 p_count명 선정.
create or replace function draw_raffle(p_round text, p_prize text, p_count int, p_days int default 30)
returns int language plpgsql security definer set search_path = public, extensions as $$
declare v_inserted int;
begin
  with eligible as (
    -- author 당 1개의 글만 (author_hash 없으면 글 자체를 개별 엔트리로)
    select distinct on (coalesce(author_hash, id::text)) id, nickname
    from posts
    where hidden = false
      and created_at > now() - make_interval(days => p_days)
    order by coalesce(author_hash, id::text), random()
  ),
  picked as (
    select id, nickname from eligible order by random() limit greatest(p_count, 0)
  ),
  ins as (
    insert into prizes (post_id, nickname, type, prize, round)
    select id, nickname, 'raffle', p_prize, p_round from picked
    returning 1
  )
  select count(*)::int into v_inserted from ins;
  return v_inserted;
end; $$;

-- 클레임: prize의 대상 글 비밀번호를 검증(본인만) → 배송정보 저장.
create or replace function submit_claim(p_prize_id uuid, p_password text, p_info jsonb)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare v_ok boolean;
begin
  select (p.password_hash = crypt(p_password, p.password_hash))
    into v_ok
  from prizes pr join posts p on p.id = pr.post_id
  where pr.id = p_prize_id;
  if v_ok is not true then return false; end if;
  update prizes set claim_info = p_info, claim_status = 'claimed', claimed_at = now()
    where id = p_prize_id;
  return true;
end; $$;

-- ---------- 실행 권한: anon/public 금지, service_role 만 ----------
revoke execute on function draw_raffle(text,text,int,int)  from public, anon, authenticated;
revoke execute on function submit_claim(uuid,text,jsonb)   from public, anon, authenticated;
grant  execute on function draw_raffle(text,text,int,int)  to service_role;
grant  execute on function submit_claim(uuid,text,jsonb)   to service_role;
