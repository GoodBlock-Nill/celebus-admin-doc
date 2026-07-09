-- ============================================================
-- 패치 006: 게시글 댓글 (평면 · 닉네임+비밀번호 · 좋아요 · OP뱃지 · 베스트 고정 · 신고)
-- Supabase SQL Editor에서 실행. posts / 001 / 003 패턴 복제.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- 테이블 ----------
create table if not exists comments (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references posts(id) on delete cascade,
  nickname      text not null check (char_length(nickname) between 1 and 20),
  body          text not null check (char_length(body) between 2 and 500),
  password_hash text not null,
  like_count    int  not null default 0,
  report_count  int  not null default 0,
  hidden        boolean not null default false,
  is_op         boolean not null default false,   -- 작성자(OP) 뱃지
  pinned        boolean not null default false,   -- 관리자 베스트 고정
  author_hash   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists comments_post_idx   on comments (post_id, pinned desc, created_at) where hidden = false;
create index if not exists comments_author_idx on comments (author_hash, created_at desc);

create table if not exists comment_likes (
  comment_id uuid not null references comments(id) on delete cascade,
  voter_hash text not null,
  created_at timestamptz not null default now(),
  primary key (comment_id, voter_hash)
);
create table if not exists comment_reports (
  comment_id    uuid not null references comments(id) on delete cascade,
  reporter_hash text not null,
  created_at    timestamptz not null default now(),
  primary key (comment_id, reporter_hash)
);

-- ---------- 공개 뷰 (민감 컬럼 제외, 숨김 제외) ----------
create or replace view comments_public as
  select id, post_id, nickname, body, like_count, is_op, pinned, created_at, updated_at,
         (updated_at > created_at) as edited
  from comments
  where hidden = false;
grant select on comments_public to anon, authenticated;

-- posts_public 재생성 (+ comment_count). drop 후 재생성.
drop view if exists posts_public;
create view posts_public as
  select p.id, p.target, p.title, p.nickname, p.body, p.like_count, p.created_at, p.updated_at,
         (p.updated_at > p.created_at) as edited,
         p.curated, p.pinned, p.impl_status, p.official_reply,
         coalesce((select count(*)::int from comments c where c.post_id = p.id and c.hidden = false), 0) as comment_count
  from posts p
  where p.hidden = false;
grant select on posts_public to anon, authenticated;

-- ---------- RLS: 기반 테이블 anon 직접 접근 차단 ----------
alter table comments        enable row level security;
alter table comment_likes   enable row level security;
alter table comment_reports enable row level security;

-- ---------- RPC (SECURITY DEFINER, service_role 전용) ----------
create or replace function recent_comment_count(p_author_hash text, p_seconds int)
returns int language sql security definer set search_path = public, extensions as $$
  select count(*)::int from comments
  where author_hash = p_author_hash
    and created_at > now() - make_interval(secs => p_seconds);
$$;

-- p_op_password 가 글 비밀번호와 일치하면 is_op = true (작성자 뱃지)
create or replace function create_comment(
  p_post_id uuid, p_nickname text, p_body text, p_password text, p_author_hash text, p_op_password text default null
) returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_is_op boolean := false;
begin
  if p_op_password is not null and length(p_op_password) > 0 then
    select exists(
      select 1 from posts where id = p_post_id and password_hash = crypt(p_op_password, password_hash)
    ) into v_is_op;
  end if;
  insert into comments (post_id, nickname, body, password_hash, author_hash, is_op)
  values (p_post_id, p_nickname, p_body, crypt(p_password, gen_salt('bf')), p_author_hash, v_is_op)
  returning id into v_id;
  return v_id;
end; $$;

create or replace function delete_comment(p_id uuid, p_password text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare v_ok boolean;
begin
  select (password_hash = crypt(p_password, password_hash)) into v_ok from comments where id = p_id;
  if v_ok is not true then return false; end if;
  delete from comments where id = p_id;
  return true;
end; $$;

create or replace function like_comment(p_id uuid, p_voter_hash text)
returns int language plpgsql security definer set search_path = public, extensions as $$
declare v_new int;
begin
  insert into comment_likes (comment_id, voter_hash) values (p_id, p_voter_hash)
  on conflict do nothing;
  if found then
    update comments set like_count = like_count + 1 where id = p_id returning like_count into v_new;
  else
    select like_count into v_new from comments where id = p_id;
  end if;
  return coalesce(v_new, 0);
end; $$;

create or replace function report_comment(p_id uuid, p_reporter_hash text, p_threshold int default 5)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  insert into comment_reports (comment_id, reporter_hash) values (p_id, p_reporter_hash)
  on conflict do nothing;
  if found then
    update comments set report_count = report_count + 1 where id = p_id;
    update comments set hidden = true where id = p_id and report_count >= p_threshold;
  end if;
end; $$;

-- ---------- 실행 권한 ----------
revoke execute on function recent_comment_count(text,int)                    from public, anon, authenticated;
revoke execute on function create_comment(uuid,text,text,text,text,text)     from public, anon, authenticated;
revoke execute on function delete_comment(uuid,text)                         from public, anon, authenticated;
revoke execute on function like_comment(uuid,text)                           from public, anon, authenticated;
revoke execute on function report_comment(uuid,text,int)                     from public, anon, authenticated;
grant  execute on function recent_comment_count(text,int)                    to service_role;
grant  execute on function create_comment(uuid,text,text,text,text,text)     to service_role;
grant  execute on function delete_comment(uuid,text)                         to service_role;
grant  execute on function like_comment(uuid,text)                           to service_role;
grant  execute on function report_comment(uuid,text,int)                     to service_role;
