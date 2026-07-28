-- 009: 멤버 하트 + 댓글 (FanStage 개편 W2)
-- 멤버 하트 = 개편의 심장: 멤버(아티스트) 계정이 하트 → 게시물에 멤버 프로필이 영구 표시(인스타 문법).
--   멤버 판정: stage_members에 등록된 신원만. 개발 기간 = 테스트 신원 등록, W4 = SSO 멤버 계정으로 전환(전체 초기화).
--   원칙: 운영자 대행 입력 없음 — 멤버 신원의 실제 액션만 (기획서 §3.2).
-- 댓글: SSO 실명 전제 설계(§3.6) — 개발 기간엔 익명 신원으로 테스트. 200자·대댓글 1단·신고 3회 자동 숨김.

-- ── 멤버 ────────────────────────────────────────────────

create table if not exists stage_members (
  user_id text primary key,                      -- 신원 추상화 id (W4에 SSO 계정 id)
  display_name text not null,                    -- 표시 이름 (예: 주연)
  avatar_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table stage_members enable row level security;

create table if not exists member_hearts (
  post_id uuid not null references stage_posts(id) on delete cascade,
  member_id text not null references stage_members(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, member_id)
);
alter table member_hearts enable row level security;

-- 멤버 하트 공개 뷰 — 멤버는 공인이므로 이름·아바타 공개
create or replace view member_hearts_public as
  select h.post_id, h.member_id, h.created_at, m.display_name, m.avatar_url, m.sort_order
  from member_hearts h
  join stage_members m on m.user_id = h.member_id
  join stage_posts p on p.id = h.post_id and p.hidden = false;
grant select on member_hearts_public to anon, authenticated;

-- 멤버 하트 토글 (서버 라우트가 멤버 여부 확인 후 호출 — RPC에서도 이중 검증)
create or replace function member_toggle_heart(p_post uuid, p_member text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from stage_members where user_id = p_member) then
    return jsonb_build_object('error', 'not_member');
  end if;
  if not exists (select 1 from stage_posts where id = p_post and hidden = false) then
    return jsonb_build_object('error', 'not_found');
  end if;
  if exists (select 1 from member_hearts where post_id = p_post and member_id = p_member) then
    delete from member_hearts where post_id = p_post and member_id = p_member;
    return jsonb_build_object('hearted', false);
  else
    insert into member_hearts (post_id, member_id) values (p_post, p_member);
    return jsonb_build_object('hearted', true);
  end if;
end $$;
revoke execute on function member_toggle_heart(uuid, text) from public, anon, authenticated;
grant  execute on function member_toggle_heart(uuid, text) to service_role;

-- ── 댓글 ────────────────────────────────────────────────

create table if not exists stage_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references stage_posts(id) on delete cascade,
  parent_id uuid references stage_comments(id) on delete cascade,  -- 대댓글 1단 (RPC에서 깊이 검증)
  owner_id text not null,
  body text not null,
  report_count int not null default 0,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
alter table stage_comments enable row level security;

create table if not exists comment_reports (
  comment_id uuid not null references stage_comments(id) on delete cascade,
  reporter_id text not null,
  created_at timestamptz not null default now(),
  primary key (comment_id, reporter_id)
);
alter table comment_reports enable row level security;

create index if not exists idx_stage_comments_post on stage_comments (post_id, created_at) where hidden = false;

-- 댓글 공개 뷰 — 작성자 신원은 비노출, 표시명만. 멤버 댓글은 멤버 정보 포함(하이라이트용)
create or replace view stage_comments_public as
  select c.id, c.post_id, c.parent_id, c.body, c.created_at,
         (m.user_id is not null) as is_member,
         m.display_name as member_name,
         m.avatar_url as member_avatar,
         -- 익명 개발 기간 표시명: 신원 해시 앞 4자 "팬-xxxx" (W4에서 SSO 닉네임으로 대체)
         'fan-' || left(md5(c.owner_id), 4) as fan_label
  from stage_comments c
  left join stage_members m on m.user_id = c.owner_id
  join stage_posts p on p.id = c.post_id and p.hidden = false
  where c.hidden = false;
grant select on stage_comments_public to anon, authenticated;

-- 댓글 작성 — 200자, 대댓글 1단 제한, 작성자당 분당 5건 캡
create or replace function comment_create(p_post uuid, p_owner text, p_body text, p_parent uuid default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_recent int; v_parent_parent uuid;
begin
  if not exists (select 1 from stage_posts where id = p_post and hidden = false) then
    return jsonb_build_object('error', 'not_found');
  end if;
  if length(trim(p_body)) = 0 or length(p_body) > 200 then
    return jsonb_build_object('error', 'bad_body');
  end if;
  if p_parent is not null then
    select parent_id into v_parent_parent from stage_comments where id = p_parent and post_id = p_post and hidden = false;
    if not found then return jsonb_build_object('error', 'not_found'); end if;
    if v_parent_parent is not null then return jsonb_build_object('error', 'too_deep'); end if;  -- 1단만
  end if;
  select count(*) into v_recent from stage_comments where owner_id = p_owner and created_at > now() - interval '60 seconds';
  if v_recent >= 5 then return jsonb_build_object('error', 'rate_capped'); end if;
  insert into stage_comments (post_id, parent_id, owner_id, body) values (p_post, p_parent, p_owner, trim(p_body))
  returning id into v_id;
  return jsonb_build_object('id', v_id);
end $$;
revoke execute on function comment_create(uuid, text, text, uuid) from public, anon, authenticated;
grant  execute on function comment_create(uuid, text, text, uuid) to service_role;

-- 댓글 삭제 — 본인만
create or replace function comment_delete(p_comment uuid, p_owner text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  delete from stage_comments where id = p_comment and owner_id = p_owner;
  if not found then return jsonb_build_object('error', 'not_found'); end if;
  return jsonb_build_object('ok', true);
end $$;
revoke execute on function comment_delete(uuid, text) from public, anon, authenticated;
grant  execute on function comment_delete(uuid, text) to service_role;

-- 댓글 신고 — 신고자별 1회, 누적 3회 자동 숨김
create or replace function comment_report(p_comment uuid, p_reporter text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_count int;
begin
  if not exists (select 1 from stage_comments where id = p_comment and hidden = false) then
    return jsonb_build_object('error', 'not_found');
  end if;
  insert into comment_reports (comment_id, reporter_id) values (p_comment, p_reporter)
  on conflict (comment_id, reporter_id) do nothing;
  if not found then return jsonb_build_object('error', 'already'); end if;
  update stage_comments set report_count = report_count + 1 where id = p_comment returning report_count into v_count;
  if v_count >= 3 then update stage_comments set hidden = true where id = p_comment; end if;
  return jsonb_build_object('ok', true);
end $$;
revoke execute on function comment_report(uuid, text) from public, anon, authenticated;
grant  execute on function comment_report(uuid, text) to service_role;

-- 본인 댓글 id 목록 (서버 라우트 전용 — '내 댓글' 삭제 버튼 표시용)
create or replace function comment_mine(p_owner text, p_post uuid)
returns jsonb language sql security definer set search_path = public, extensions as $$
  select coalesce(jsonb_agg(id), '[]'::jsonb) from stage_comments
  where owner_id = p_owner and post_id = p_post and hidden = false;
$$;
revoke execute on function comment_mine(text, uuid) from public, anon, authenticated;
grant  execute on function comment_mine(text, uuid) to service_role;
