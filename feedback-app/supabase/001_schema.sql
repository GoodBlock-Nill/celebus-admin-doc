-- ============================================================
-- CELEBUS FeedBack — 스키마 / RLS / RPC
-- 새 Supabase 프로젝트의 SQL Editor에 그대로 실행하세요.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- 테이블 ----------
create table if not exists posts (
  id            uuid primary key default gen_random_uuid(),
  target        text not null default '전체' check (target in ('V01D','CELEBUS','ix','전체')),
  nickname      text not null check (char_length(nickname) between 1 and 20),
  body          text not null check (char_length(body) between 2 and 500),
  password_hash text not null,
  like_count    int  not null default 0,
  report_count  int  not null default 0,
  hidden        boolean not null default false,
  author_hash   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists posts_popular_idx on posts (like_count desc, created_at desc) where hidden = false;
create index if not exists posts_recent_idx  on posts (created_at desc) where hidden = false;
create index if not exists posts_author_idx  on posts (author_hash, created_at desc);

create table if not exists post_likes (
  post_id    uuid not null references posts(id) on delete cascade,
  voter_hash text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, voter_hash)
);

create table if not exists post_reports (
  post_id      uuid not null references posts(id) on delete cascade,
  reporter_hash text not null,
  created_at   timestamptz not null default now(),
  primary key (post_id, reporter_hash)
);

-- ---------- 공개 뷰 (민감 컬럼 제외, 숨김글 제외) ----------
-- 뷰는 소유자(postgres) 권한으로 실행 → 기반 테이블 RLS를 우회하되, 노출 컬럼/행을 여기서 통제.
create or replace view posts_public as
  select id, target, nickname, body, like_count, created_at, updated_at,
         (updated_at > created_at) as edited
  from posts
  where hidden = false;

-- ---------- RLS: 기반 테이블은 anon 직접 접근 전면 차단 ----------
alter table posts        enable row level security;
alter table post_likes   enable row level security;
alter table post_reports enable row level security;
-- (정책을 만들지 않음 => anon 은 기반 테이블에 아무 것도 할 수 없음. 읽기는 뷰로만, 쓰기는 서버(service_role)로만.)

grant select on posts_public to anon, authenticated;

-- ---------- 함수(RPC) : 모두 SECURITY DEFINER, 서버(service_role)에서만 호출 ----------
create or replace function recent_post_count(p_author_hash text, p_seconds int)
returns int language sql security definer set search_path = public, extensions as $$
  select count(*)::int from posts
  where author_hash = p_author_hash
    and created_at > now() - make_interval(secs => p_seconds);
$$;

create or replace function create_post(
  p_target text, p_nickname text, p_body text, p_password text, p_author_hash text
) returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid;
begin
  insert into posts (target, nickname, body, password_hash, author_hash)
  values (p_target, p_nickname, p_body, crypt(p_password, gen_salt('bf')), p_author_hash)
  returning id into v_id;
  return v_id;
end; $$;

create or replace function update_post(
  p_id uuid, p_password text, p_target text, p_nickname text, p_body text
) returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare v_ok boolean;
begin
  select (password_hash = crypt(p_password, password_hash))
    into v_ok from posts where id = p_id and hidden = false;
  if v_ok is not true then return false; end if;
  update posts set target = p_target, nickname = p_nickname, body = p_body, updated_at = now()
    where id = p_id;
  return true;
end; $$;

create or replace function delete_post(p_id uuid, p_password text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare v_ok boolean;
begin
  select (password_hash = crypt(p_password, password_hash))
    into v_ok from posts where id = p_id;
  if v_ok is not true then return false; end if;
  delete from posts where id = p_id;
  return true;
end; $$;

create or replace function like_post(p_id uuid, p_voter_hash text)
returns int language plpgsql security definer set search_path = public, extensions as $$
declare v_new int;
begin
  insert into post_likes (post_id, voter_hash) values (p_id, p_voter_hash)
  on conflict do nothing;
  if found then
    update posts set like_count = like_count + 1 where id = p_id returning like_count into v_new;
  else
    select like_count into v_new from posts where id = p_id;
  end if;
  return coalesce(v_new, 0);
end; $$;

create or replace function report_post(p_id uuid, p_reporter_hash text, p_threshold int default 5)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  insert into post_reports (post_id, reporter_hash) values (p_id, p_reporter_hash)
  on conflict do nothing;
  if found then
    update posts set report_count = report_count + 1 where id = p_id;
    update posts set hidden = true where id = p_id and report_count >= p_threshold;
  end if;
end; $$;

-- ---------- 함수 실행 권한: anon/public 금지, service_role 만 허용 ----------
revoke execute on function recent_post_count(text,int)                 from public, anon, authenticated;
revoke execute on function create_post(text,text,text,text,text)       from public, anon, authenticated;
revoke execute on function update_post(uuid,text,text,text,text)       from public, anon, authenticated;
revoke execute on function delete_post(uuid,text)                      from public, anon, authenticated;
revoke execute on function like_post(uuid,text)                        from public, anon, authenticated;
revoke execute on function report_post(uuid,text,int)                  from public, anon, authenticated;

grant execute on function recent_post_count(text,int)            to service_role;
grant execute on function create_post(text,text,text,text,text)  to service_role;
grant execute on function update_post(uuid,text,text,text,text)  to service_role;
grant execute on function delete_post(uuid,text)                 to service_role;
grant execute on function like_post(uuid,text)                   to service_role;
grant execute on function report_post(uuid,text,int)             to service_role;
