-- 010: 인앱 알림 + 멤버 로스터 공개 뷰 (FanStage 개편 W2 잔여)
-- 알림 = "주연 님이 회원님의 영상에 하트를 남겼어요 💜" — 이 서비스가 보낼 수 있는 가장 강력한 한 통.
--   생성 지점은 RPC 내부(하트 on·댓글 작성) — 애플리케이션 계층 누락 불가.
-- members_public = 멤버 로스터(공인 정보) — 그랜드슬램(전원 하트) 판정·멤버 소개용.

create table if not exists stage_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,                         -- 수신자 (신원 추상화 — W4 SSO 전환·초기화)
  type text not null check (type in ('member_heart','member_comment','fan_comment')),
  post_id uuid references stage_posts(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,    -- { member_name?, post_title, ... }
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table stage_notifications enable row level security;
create index if not exists idx_notifications_user on stage_notifications (user_id, created_at desc);

-- 멤버 로스터 공개 뷰 (멤버는 공인 — 이름·아바타만)
create or replace view members_public as
  select display_name, avatar_url, sort_order from stage_members order by sort_order;
grant select on members_public to anon, authenticated;

-- ── 알림 생성을 포함하도록 RPC 재정의 ──────────────────────

-- 멤버 하트 토글 (+하트 on 시 게시물 주인에게 알림, 본인 글이면 생략)
create or replace function member_toggle_heart(p_post uuid, p_member text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_owner text; v_title text; v_name text;
begin
  if not exists (select 1 from stage_members where user_id = p_member) then
    return jsonb_build_object('error', 'not_member');
  end if;
  select owner_id, title into v_owner, v_title from stage_posts where id = p_post and hidden = false;
  if v_owner is null then return jsonb_build_object('error', 'not_found'); end if;
  if exists (select 1 from member_hearts where post_id = p_post and member_id = p_member) then
    delete from member_hearts where post_id = p_post and member_id = p_member;
    return jsonb_build_object('hearted', false);
  else
    insert into member_hearts (post_id, member_id) values (p_post, p_member);
    if v_owner <> p_member then
      select display_name into v_name from stage_members where user_id = p_member;
      insert into stage_notifications (user_id, type, post_id, payload)
      values (v_owner, 'member_heart', p_post, jsonb_build_object('member_name', v_name, 'post_title', v_title));
    end if;
    return jsonb_build_object('hearted', true);
  end if;
end $$;
revoke execute on function member_toggle_heart(uuid, text) from public, anon, authenticated;
grant  execute on function member_toggle_heart(uuid, text) to service_role;

-- 댓글 작성 (+게시물 주인에게 알림 — 멤버 댓글은 member_comment 타입으로 강조)
create or replace function comment_create(p_post uuid, p_owner text, p_body text, p_parent uuid default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_recent int; v_parent_parent uuid; v_post_owner text; v_title text; v_member_name text;
begin
  select owner_id, title into v_post_owner, v_title from stage_posts where id = p_post and hidden = false;
  if v_post_owner is null then return jsonb_build_object('error', 'not_found'); end if;
  if length(trim(p_body)) = 0 or length(p_body) > 200 then
    return jsonb_build_object('error', 'bad_body');
  end if;
  if p_parent is not null then
    select parent_id into v_parent_parent from stage_comments where id = p_parent and post_id = p_post and hidden = false;
    if not found then return jsonb_build_object('error', 'not_found'); end if;
    if v_parent_parent is not null then return jsonb_build_object('error', 'too_deep'); end if;
  end if;
  select count(*) into v_recent from stage_comments where owner_id = p_owner and created_at > now() - interval '60 seconds';
  if v_recent >= 5 then return jsonb_build_object('error', 'rate_capped'); end if;
  insert into stage_comments (post_id, parent_id, owner_id, body) values (p_post, p_parent, p_owner, trim(p_body))
  returning id into v_id;
  if v_post_owner <> p_owner then
    select display_name into v_member_name from stage_members where user_id = p_owner;
    insert into stage_notifications (user_id, type, post_id, payload)
    values (v_post_owner,
            case when v_member_name is not null then 'member_comment' else 'fan_comment' end,
            p_post,
            jsonb_build_object('member_name', v_member_name, 'post_title', v_title, 'body', left(trim(p_body), 60)));
  end if;
  return jsonb_build_object('id', v_id);
end $$;
revoke execute on function comment_create(uuid, text, text, uuid) from public, anon, authenticated;
grant  execute on function comment_create(uuid, text, text, uuid) to service_role;

-- ── 알림 조회·읽음 (서버 라우트 전용) ─────────────────────

create or replace function notifications_list(p_user text)
returns jsonb language sql security definer set search_path = public, extensions as $$
  select jsonb_build_object(
    'unread', (select count(*) from stage_notifications where user_id = p_user and read = false),
    'items', coalesce((select jsonb_agg(row_to_json(t)) from (
      select id, type, post_id, payload, read, created_at
      from stage_notifications where user_id = p_user
      order by created_at desc limit 30
    ) t), '[]'::jsonb)
  );
$$;
revoke execute on function notifications_list(text) from public, anon, authenticated;
grant  execute on function notifications_list(text) to service_role;

create or replace function notifications_read_all(p_user text)
returns jsonb language sql security definer set search_path = public, extensions as $$
  with u as (update stage_notifications set read = true where user_id = p_user and read = false returning 1)
  select jsonb_build_object('ok', true, 'count', (select count(*) from u));
$$;
revoke execute on function notifications_read_all(text) from public, anon, authenticated;
grant  execute on function notifications_read_all(text) to service_role;
