-- ============================================================
-- FanStage 001: 콘테스트 스키마 (FanVoice와 같은 Supabase 공존 — contest_ prefix)
-- 보안 골격 = FanVoice 001 패턴:
--   기반 테이블 RLS enable + 정책 없음(anon 전면 차단)
--   읽기 = 공개 뷰(민감 컬럼 제외, grant anon)
--   쓰기 = SECURITY DEFINER RPC(service_role만 실행)
-- Supabase SQL Editor에서 실행.
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

-- ── 테이블 ──────────────────────────────────────────────────

create table if not exists contests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  artist text not null default 'V01D',
  contest_type text not null check (contest_type in ('image','video')),
  title text not null,
  description text not null default '',
  rules text not null default '',
  prize_summary text not null default '',
  prizes jsonb not null default '[]',           -- [{rank_label,name,image_url,award_type:'popular'|'judge',count}]
  cover_image_url text,
  status text not null default 'draft'
    check (status in ('draft','open','voting','judging','announced','closed')),
  submit_start_at timestamptz,
  submit_end_at timestamptz,
  vote_end_at timestamptz,
  announce_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table contests enable row level security;

create table if not exists contest_entries (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references contests(id) on delete cascade,
  platform text not null check (platform in ('youtube','tiktok','x','instagram','threads')),
  source_url text not null,
  external_id text not null,
  oembed jsonb,                                  -- 제출 시 캐시한 메타(thumbnail_url/title/author_name) — 폴백 카드용
  title text not null,
  description text not null default '',
  handle text not null,                          -- SNS 핸들(@ 제외 저장, 공개)
  password_hash text not null,                   -- bcrypt(crypt/gen_salt)
  vote_count int not null default 0,
  report_count int not null default 0,
  hidden boolean not null default false,         -- 신고/운영 숨김
  disqualified boolean not null default false,   -- 심사 실격(공개 표기)
  disqualify_reason text,
  author_hash text,                              -- salted IP (레이트리밋)
  linked_user_id uuid,                           -- ★ CELEBUS 계정연동 예약 (파일럿에선 항상 null)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contest_id, platform, external_id)     -- 중복 출품 최종 방어
);
alter table contest_entries enable row level security;
create index if not exists contest_entries_leaderboard_idx
  on contest_entries (contest_id, vote_count desc, created_at asc) where hidden = false;
create index if not exists contest_entries_author_idx
  on contest_entries (author_hash, created_at);

create table if not exists contest_votes (
  entry_id uuid not null references contest_entries(id) on delete cascade,
  contest_id uuid not null,                      -- 비정규화: 콘테스트별 일일한도 집계용
  voter_hash text not null,                      -- hash(디바이스ID)
  created_at timestamptz not null default now(),
  primary key (entry_id, voter_hash)
);
alter table contest_votes enable row level security;
create index if not exists contest_votes_daily_idx on contest_votes (contest_id, voter_hash, created_at);
create index if not exists contest_votes_trending_idx on contest_votes (entry_id, created_at);
create index if not exists contest_votes_voter_recent_idx on contest_votes (voter_hash, created_at);

create table if not exists contest_reports (
  entry_id uuid not null references contest_entries(id) on delete cascade,
  reporter_hash text not null,
  created_at timestamptz not null default now(),
  primary key (entry_id, reporter_hash)
);
alter table contest_reports enable row level security;

create table if not exists contest_awards (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references contests(id) on delete cascade,
  entry_id uuid references contest_entries(id) on delete set null,
  handle text not null,                          -- 발표용 비정규화
  award_type text not null check (award_type in ('popular','judge')),
  award_name text not null,                      -- '인기상 1위' 등
  rank int,
  prize text not null default '',
  claim_status text not null default 'none' check (claim_status in ('none','claimed','shipped')),
  claim_info jsonb,                              -- 배송지 민감정보 — 뷰 제외, 서버 전용
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  shipped_at timestamptz
);
alter table contest_awards enable row level security;

-- ── 공개 뷰 ──────────────────────────────────────────────────

drop view if exists contests_public;
create view contests_public as
  select id, slug, artist, contest_type, title, description, rules, prize_summary, prizes,
         cover_image_url, status, submit_start_at, submit_end_at, vote_end_at, announce_at, created_at
  from contests
  where status <> 'draft';
grant select on contests_public to anon, authenticated;

drop view if exists contest_entries_public;
create view contest_entries_public as
  select e.id, e.contest_id, e.platform, e.source_url, e.external_id,
         e.title, e.description, e.handle, e.vote_count, e.disqualified,
         e.created_at, e.updated_at, (e.updated_at > e.created_at) as edited,
         e.oembed->>'thumbnail_url' as thumbnail_url,
         e.oembed->>'title'         as oembed_title,
         e.oembed->>'author_name'   as oembed_author
  from contest_entries e
  join contests c on c.id = e.contest_id and c.status <> 'draft'
  where e.hidden = false;
grant select on contest_entries_public to anon, authenticated;

drop view if exists contest_awards_public;
create view contest_awards_public as
  select a.id, a.contest_id, a.entry_id, a.handle, a.award_type, a.award_name,
         a.rank, a.prize, a.claim_status, a.created_at
  from contest_awards a
  join contests c on c.id = a.contest_id and c.status in ('announced','closed');
grant select on contest_awards_public to anon, authenticated;

-- ── RPC 함수 (SECURITY DEFINER, service_role 전용) ───────────

-- 레이트리밋: author_hash 기준 최근 N초 출품 수
create or replace function contest_recent_entry_count(p_author_hash text, p_seconds int)
returns int language sql security definer set search_path = public, extensions as $$
  select count(*)::int from contest_entries
  where author_hash = p_author_hash
    and created_at > now() - make_interval(secs => p_seconds);
$$;

-- 출품 (open 상태 + 접수 기간 내에서만, 중복 시 'duplicate')
create or replace function contest_create_entry(
  p_contest_id uuid, p_platform text, p_source_url text, p_external_id text,
  p_oembed jsonb, p_title text, p_description text, p_handle text,
  p_password text, p_author_hash text
) returns text language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_status text; v_start timestamptz; v_end timestamptz;
begin
  select status, submit_start_at, submit_end_at into v_status, v_start, v_end
    from contests where id = p_contest_id;
  if v_status is null then return 'not_found'; end if;
  if v_status <> 'open'
     or (v_start is not null and now() < v_start)
     or (v_end is not null and now() > v_end) then
    return 'closed';
  end if;
  begin
    insert into contest_entries
      (contest_id, platform, source_url, external_id, oembed, title, description, handle, password_hash, author_hash)
    values
      (p_contest_id, p_platform, p_source_url, p_external_id, p_oembed, p_title, p_description, p_handle,
       crypt(p_password, gen_salt('bf')), p_author_hash)
    returning id into v_id;
  exception when unique_violation then
    return 'duplicate';
  end;
  return v_id::text;
end; $$;

-- 본인 확인
create or replace function contest_verify_entry(p_id uuid, p_password text)
returns boolean language sql security definer set search_path = public, extensions as $$
  select coalesce(
    (select password_hash = crypt(p_password, password_hash)
       from contest_entries where id = p_id and hidden = false), false);
$$;

-- 수정 (콘테스트 open 상태에서만 — 투표 시작 후 바꿔치기 방지. 링크·플랫폼은 불변)
create or replace function contest_update_entry(p_id uuid, p_password text, p_title text, p_description text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare v_ok boolean;
begin
  select (e.password_hash = crypt(p_password, e.password_hash)) and c.status = 'open'
    into v_ok
    from contest_entries e join contests c on c.id = e.contest_id
   where e.id = p_id and e.hidden = false;
  if v_ok is not true then return false; end if;
  update contest_entries set title = p_title, description = p_description, updated_at = now()
   where id = p_id;
  return true;
end; $$;

-- 삭제 (콘테스트 open 상태에서만)
create or replace function contest_delete_entry(p_id uuid, p_password text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare v_ok boolean;
begin
  select (e.password_hash = crypt(p_password, e.password_hash)) and c.status = 'open'
    into v_ok
    from contest_entries e join contests c on c.id = e.contest_id
   where e.id = p_id;
  if v_ok is not true then return false; end if;
  delete from contest_entries where id = p_id;
  return true;
end; $$;

-- 투표: 중복/기간/상태/일일한도/속도 검증. 반환: 'ok'|'dup'|'limit'|'closed'|'blocked'|'not_found'
create or replace function contest_vote(
  p_entry_id uuid, p_voter_hash text,
  p_daily_limit int default 5, p_window_limit int default 20, p_window_seconds int default 3600
) returns text language plpgsql security definer set search_path = public, extensions as $$
declare
  v_contest uuid; v_hidden boolean; v_dq boolean; v_status text; v_vote_end timestamptz;
  v_today int; v_recent int; v_kst_day timestamptz;
begin
  select e.contest_id, e.hidden, e.disqualified, c.status, c.vote_end_at
    into v_contest, v_hidden, v_dq, v_status, v_vote_end
    from contest_entries e join contests c on c.id = e.contest_id
   where e.id = p_entry_id;
  if v_contest is null then return 'not_found'; end if;
  if v_hidden or v_dq then return 'blocked'; end if;
  if v_status not in ('open','voting')
     or (v_vote_end is not null and now() > v_vote_end) then
    return 'closed';
  end if;

  -- 콘테스트별 일일한도 (KST 자정 기준)
  v_kst_day := date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';
  select count(*) into v_today from contest_votes
   where contest_id = v_contest and voter_hash = p_voter_hash and created_at >= v_kst_day;
  if v_today >= p_daily_limit then return 'limit'; end if;

  -- 디바이스 속도 제한 (전 콘테스트 합산, 기본 시간당 20표)
  select count(*) into v_recent from contest_votes
   where voter_hash = p_voter_hash and created_at > now() - make_interval(secs => p_window_seconds);
  if v_recent >= p_window_limit then return 'limit'; end if;

  insert into contest_votes (entry_id, contest_id, voter_hash)
  values (p_entry_id, v_contest, p_voter_hash)
  on conflict do nothing;
  if found then
    update contest_entries set vote_count = vote_count + 1 where id = p_entry_id;
    return 'ok';
  end if;
  return 'dup';
end; $$;

-- 신고: 누적 임계치 도달 시 자동 숨김
create or replace function contest_report_entry(p_entry_id uuid, p_reporter_hash text, p_threshold int default 5)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare v_count int;
begin
  insert into contest_reports (entry_id, reporter_hash)
  values (p_entry_id, p_reporter_hash)
  on conflict do nothing;
  if not found then return false; end if;
  update contest_entries set report_count = report_count + 1 where id = p_entry_id
    returning report_count into v_count;
  if v_count >= p_threshold then
    update contest_entries set hidden = true where id = p_entry_id;
  end if;
  return true;
end; $$;

-- 보상 클레임: 수상 엔트리의 비밀번호로 본인 확인 후 배송정보 저장
create or replace function contest_submit_claim(p_award_id uuid, p_password text, p_info jsonb)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare v_ok boolean;
begin
  select (e.password_hash = crypt(p_password, e.password_hash))
    into v_ok
    from contest_awards a join contest_entries e on e.id = a.entry_id
   where a.id = p_award_id and a.claim_status = 'none';
  if v_ok is not true then return false; end if;
  update contest_awards
     set claim_info = p_info, claim_status = 'claimed', claimed_at = now()
   where id = p_award_id;
  return true;
end; $$;

-- 인기상 확정: 득표순(동점=선착순) TOP N을 awards에 snapshot. 이미 확정 시 -1
-- p_awards = [{award_name, prize}] 배열 (배열 순서 = 1위부터)
create or replace function contest_finalize_popular(p_contest_id uuid, p_awards jsonb)
returns int language plpgsql security definer set search_path = public, extensions as $$
declare v_n int; v_count int := 0; r record; i int := 0;
begin
  v_n := jsonb_array_length(p_awards);
  if v_n is null or v_n < 1 then return 0; end if;
  if exists (select 1 from contest_awards where contest_id = p_contest_id and award_type = 'popular') then
    return -1;
  end if;
  for r in
    select id, handle from contest_entries
     where contest_id = p_contest_id and hidden = false and disqualified = false
     order by vote_count desc, created_at asc
     limit v_n
  loop
    insert into contest_awards (contest_id, entry_id, handle, award_type, award_name, rank, prize)
    values (p_contest_id, r.id, r.handle, 'popular',
            coalesce(p_awards->i->>'award_name', '인기상 ' || (i + 1) || '위'),
            i + 1,
            coalesce(p_awards->i->>'prize', ''));
    i := i + 1; v_count := v_count + 1;
  end loop;
  return v_count;
end; $$;

-- 급상승: 최근 N시간 득표 상위 (숨김/실격 제외)
create or replace function contest_trending_entries(p_contest_id uuid, p_hours int default 24, p_limit int default 5)
returns table (entry_id uuid, recent_votes bigint)
language sql security definer set search_path = public, extensions as $$
  select v.entry_id, count(*) as recent_votes
    from contest_votes v
    join contest_entries e on e.id = v.entry_id and e.hidden = false and e.disqualified = false
   where v.contest_id = p_contest_id
     and v.created_at > now() - make_interval(hours => p_hours)
   group by v.entry_id
   order by recent_votes desc
   limit p_limit;
$$;

-- ── 실행 권한: anon 차단, service_role만 ─────────────────────

revoke execute on function contest_recent_entry_count(text,int) from public, anon, authenticated;
revoke execute on function contest_create_entry(uuid,text,text,text,jsonb,text,text,text,text,text) from public, anon, authenticated;
revoke execute on function contest_verify_entry(uuid,text) from public, anon, authenticated;
revoke execute on function contest_update_entry(uuid,text,text,text) from public, anon, authenticated;
revoke execute on function contest_delete_entry(uuid,text) from public, anon, authenticated;
revoke execute on function contest_vote(uuid,text,int,int,int) from public, anon, authenticated;
revoke execute on function contest_report_entry(uuid,text,int) from public, anon, authenticated;
revoke execute on function contest_submit_claim(uuid,text,jsonb) from public, anon, authenticated;
revoke execute on function contest_finalize_popular(uuid,jsonb) from public, anon, authenticated;
revoke execute on function contest_trending_entries(uuid,int,int) from public, anon, authenticated;

grant execute on function contest_recent_entry_count(text,int) to service_role;
grant execute on function contest_create_entry(uuid,text,text,text,jsonb,text,text,text,text,text) to service_role;
grant execute on function contest_verify_entry(uuid,text) to service_role;
grant execute on function contest_update_entry(uuid,text,text,text) to service_role;
grant execute on function contest_delete_entry(uuid,text) to service_role;
grant execute on function contest_vote(uuid,text,int,int,int) to service_role;
grant execute on function contest_report_entry(uuid,text,int) to service_role;
grant execute on function contest_submit_claim(uuid,text,jsonb) to service_role;
grant execute on function contest_finalize_popular(uuid,jsonb) to service_role;
grant execute on function contest_trending_entries(uuid,int,int) to service_role;
