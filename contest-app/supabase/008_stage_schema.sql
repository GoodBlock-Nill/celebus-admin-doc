-- 008: 상시 스테이지 (FanStage 개편 W1)
-- 구조: 관리자가 "스테이지"(공연 단위 컨테이너)를 생성 → 유저가 해당 스테이지에 영상 업로드.
--   공연별 영상 아카이브가 핵심. 스테이지는 기간 마감 없이 상시(open) — 관리자가 보관(archived) 전환 시 열람만.
-- 신원 추상화: owner_id/voter_id = 서버 발급 신원 문자열.
--   개발 기간(W1~W3) = 익명 HMAC 쿠키 id → W4에서 SSO 계정 id로 전환하며 데이터 전체 초기화 예정.
-- 보안 패턴은 001과 동일: 기반 테이블 RLS 전면차단, 읽기는 *_public 뷰, 쓰기는 RPC(service_role)만.
--   (스테이지 생성·관리는 관리자 라우트가 service_role로 직접 수행 — contests와 동일 패턴)

-- ── 테이블 ──────────────────────────────────────────────

create table if not exists stages (
  id uuid primary key default gen_random_uuid(),
  title text not null,                           -- 공연명 (예: 2026 여름 부산 버스킹)
  description text not null default '',
  cover_url text,
  event_date date,                               -- 공연 일자 (표기·정렬용)
  status text not null default 'open' check (status in ('open','archived')),  -- open=업로드 가능 / archived=열람만
  hidden boolean not null default false,         -- 준비 중·비공개
  post_count int not null default 0,             -- 캐시 (RPC에서 증감)
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table stages enable row level security;

create table if not exists stage_posts (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references stages(id) on delete cascade,
  owner_id text not null,                        -- 신원 추상화 (W4 초기화·전환)
  platform text not null check (platform in ('youtube','tiktok','x','instagram','threads')),
  source_url text not null,
  external_id text not null,
  oembed jsonb,
  title text not null,
  description text not null default '',
  handle text not null,
  handle_verified boolean not null default false,
  category text not null check (category in ('fancam','cover','edit','etc')),  -- 스테이지 내 보조 필터
  like_count int not null default 0,             -- 팬 하트 캐시 (멤버 하트는 W2 별도)
  report_count int not null default 0,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stage_id, platform, external_id)       -- 같은 스테이지 내 중복 방지
);
alter table stage_posts enable row level security;

create table if not exists stage_likes (
  post_id uuid not null references stage_posts(id) on delete cascade,
  voter_id text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, voter_id)
);
alter table stage_likes enable row level security;

create table if not exists stage_reports (
  post_id uuid not null references stage_posts(id) on delete cascade,
  reporter_id text not null,
  reason text not null default '',
  created_at timestamptz not null default now(),
  primary key (post_id, reporter_id)
);
alter table stage_reports enable row level security;

create index if not exists idx_stage_posts_stage on stage_posts (stage_id, created_at desc) where hidden = false;
create index if not exists idx_stage_posts_owner on stage_posts (owner_id, created_at desc);

-- ── 공개 뷰 (owner_id 비노출 — 신원 추적 방지) ─────────────

create or replace view stages_public as
  select s.id, s.title, s.description, s.cover_url, s.event_date, s.status, s.post_count, s.sort_order, s.created_at
  from stages s
  where s.hidden = false;
grant select on stages_public to anon, authenticated;

create or replace view stage_posts_public as
  select p.id, p.stage_id, p.platform, p.source_url, p.external_id, p.title, p.description,
         p.handle, p.handle_verified, p.category, p.like_count, p.created_at,
         (p.updated_at > p.created_at) as edited,
         p.oembed->>'thumbnail_url' as thumbnail_url,
         p.oembed->>'title'         as oembed_title,
         p.oembed->>'author_name'   as oembed_author
  from stage_posts p
  join stages s on s.id = p.stage_id and s.hidden = false
  where p.hidden = false;
grant select on stage_posts_public to anon, authenticated;

-- ── RPC (service_role 전용) ─────────────────────────────

-- 업로드 — 스테이지 open 검증 + 스테이지 내 중복 방지 + 소유자당 24시간 10건 캡
create or replace function stage_create_post(
  p_stage uuid, p_owner text, p_platform text, p_source_url text, p_external_id text,
  p_oembed jsonb, p_title text, p_description text, p_handle text, p_handle_verified boolean,
  p_category text
) returns text language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_recent int; v_status text;
begin
  select status into v_status from stages where id = p_stage and hidden = false;
  if v_status is null then return 'not_found'; end if;
  if v_status <> 'open' then return 'closed'; end if;
  select count(*) into v_recent from stage_posts
    where owner_id = p_owner and created_at > now() - interval '24 hours';
  if v_recent >= 10 then return 'rate_capped'; end if;
  if exists (select 1 from stage_posts where stage_id = p_stage and platform = p_platform and external_id = p_external_id) then
    return 'duplicate';
  end if;
  insert into stage_posts (stage_id, owner_id, platform, source_url, external_id, oembed, title, description, handle, handle_verified, category)
  values (p_stage, p_owner, p_platform, p_source_url, p_external_id, p_oembed, p_title, p_description, p_handle, p_handle_verified, p_category)
  returning id into v_id;
  update stages set post_count = post_count + 1, updated_at = now() where id = p_stage;
  return v_id::text;
end $$;
revoke execute on function stage_create_post(uuid,text,text,text,text,jsonb,text,text,text,boolean,text) from public, anon, authenticated;
grant  execute on function stage_create_post(uuid,text,text,text,text,jsonb,text,text,text,boolean,text) to service_role;

-- 팬 하트 토글
create or replace function stage_toggle_like(p_post uuid, p_voter text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_count int;
begin
  if not exists (select 1 from stage_posts where id = p_post and hidden = false) then
    return jsonb_build_object('error', 'not_found');
  end if;
  if exists (select 1 from stage_likes where post_id = p_post and voter_id = p_voter) then
    delete from stage_likes where post_id = p_post and voter_id = p_voter;
    update stage_posts set like_count = greatest(like_count - 1, 0) where id = p_post returning like_count into v_count;
    return jsonb_build_object('liked', false, 'like_count', v_count);
  else
    insert into stage_likes (post_id, voter_id) values (p_post, p_voter);
    update stage_posts set like_count = like_count + 1 where id = p_post returning like_count into v_count;
    return jsonb_build_object('liked', true, 'like_count', v_count);
  end if;
end $$;
revoke execute on function stage_toggle_like(uuid, text) from public, anon, authenticated;
grant  execute on function stage_toggle_like(uuid, text) to service_role;

-- 신고 — 신고자별 1회, 누적 5회 자동 숨김
create or replace function stage_report_post(p_post uuid, p_reporter text, p_reason text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_count int;
begin
  if not exists (select 1 from stage_posts where id = p_post) then
    return jsonb_build_object('error', 'not_found');
  end if;
  insert into stage_reports (post_id, reporter_id, reason) values (p_post, p_reporter, left(coalesce(p_reason, ''), 200))
  on conflict (post_id, reporter_id) do nothing;
  if not found then return jsonb_build_object('error', 'already'); end if;
  update stage_posts set report_count = report_count + 1 where id = p_post returning report_count into v_count;
  if v_count >= 5 then update stage_posts set hidden = true where id = p_post; end if;
  return jsonb_build_object('ok', true);
end $$;
revoke execute on function stage_report_post(uuid, text, text) from public, anon, authenticated;
grant  execute on function stage_report_post(uuid, text, text) to service_role;

-- 삭제 — 소유자 본인만 (post_count 감소 포함)
create or replace function stage_delete_post(p_post uuid, p_owner text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_stage uuid;
begin
  delete from stage_posts where id = p_post and owner_id = p_owner returning stage_id into v_stage;
  if not found then return jsonb_build_object('error', 'not_found'); end if;
  update stages set post_count = greatest(post_count - 1, 0) where id = v_stage;
  return jsonb_build_object('ok', true);
end $$;
revoke execute on function stage_delete_post(uuid, text) from public, anon, authenticated;
grant  execute on function stage_delete_post(uuid, text) to service_role;

-- 내 게시물 (서버 라우트 전용 — 숨김 포함 본인 전체, 스테이지명 포함)
create or replace function stage_my_posts(p_owner text)
returns jsonb language sql security definer set search_path = public, extensions as $$
  select coalesce(jsonb_agg(row_to_json(t) order by t.created_at desc), '[]'::jsonb) from (
    select p.id, p.stage_id, s.title as stage_title, p.platform, p.source_url, p.title, p.category,
           p.like_count, p.report_count, p.hidden, p.created_at,
           p.oembed->>'thumbnail_url' as thumbnail_url
    from stage_posts p join stages s on s.id = p.stage_id
    where p.owner_id = p_owner
  ) t;
$$;
revoke execute on function stage_my_posts(text) from public, anon, authenticated;
grant  execute on function stage_my_posts(text) to service_role;

-- 내 하트 상태 조회 (서버 라우트 전용 — 피드 하트 표시용)
create or replace function stage_my_likes(p_voter text, p_posts uuid[])
returns jsonb language sql security definer set search_path = public, extensions as $$
  select coalesce(jsonb_agg(post_id), '[]'::jsonb) from stage_likes
  where voter_id = p_voter and post_id = any(p_posts);
$$;
revoke execute on function stage_my_likes(text, uuid[]) from public, anon, authenticated;
grant  execute on function stage_my_likes(text, uuid[]) to service_role;
