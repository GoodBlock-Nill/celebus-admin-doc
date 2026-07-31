-- 032: 토너먼트 복수 아카이브 — D10V(팬) 토너먼트는 여러 팬 아카이브의 공개 영상을 합쳐 출전.
-- stage_events.stage_id는 대표(primary) 아카이브로 유지(V01D 단일·D10V 첫 선택), 전체 집합은 조인 테이블로.
-- 게임 로직(제출·픽 검증)·플레이 풀·수상 집계는 "이벤트의 아카이브 집합" 기준으로 전환.

create table if not exists stage_event_stages (
  event_id uuid not null references stage_events(id) on delete cascade,
  stage_id uuid not null references stages(id) on delete cascade,
  primary key (event_id, stage_id)
);
alter table stage_event_stages enable row level security;
create index if not exists idx_ses_event on stage_event_stages (event_id);

-- 기존 이벤트 백필 — 각 이벤트의 대표 stage를 집합에 1행씩
insert into stage_event_stages (event_id, stage_id)
  select id, stage_id from stage_events
  on conflict do nothing;

-- ── 공개 뷰: stage_ids(집합)·stage_count 말미 추가 ──
create or replace view stage_events_public as
  select e.id, e.stage_id, s.title as stage_title, e.title, e.description, e.status, e.ends_at, e.awards, e.created_at,
         e.type, e.submit_start_at, e.submit_end_at, e.rewards,
         e.reward_type, e.reward,
         e.category, s.is_official as stage_is_official,
         e.cover_url,
         e.i18n,
         s.i18n as stage_i18n,
         (select array_agg(ses.stage_id) from stage_event_stages ses where ses.event_id = e.id) as stage_ids,
         (select count(*)::int from stage_event_stages ses where ses.event_id = e.id) as stage_count
  from stage_events e
  join stages s on s.id = e.stage_id and s.hidden = false
  where e.status in ('open', 'announced');
grant select on stage_events_public to anon, authenticated;

-- ── RPC: 이벤트의 아카이브 집합 기준으로 검증 ──

-- 월드컵 런 제출 — 등장 포스트가 이벤트의 아카이브 집합에 속한 공개 영상인지 검증
create or replace function worldcup_submit_run(p_event uuid, p_user text, p_picks jsonb, p_winner uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_status text; v_counted boolean; v_prev int; v_n int;
  v_pick jsonb; v_w uuid; v_l uuid; v_last_w uuid;
  v_posts uuid[];
begin
  select status into v_status from stage_events where id = p_event;
  if v_status is null or v_status <> 'open' then return jsonb_build_object('error', 'closed'); end if;

  v_n := jsonb_array_length(p_picks);
  if v_n not in (1, 3, 7, 15, 31) then return jsonb_build_object('error', 'bad_bracket'); end if;

  v_posts := array[]::uuid[];
  for i in 0 .. v_n - 1 loop
    v_pick := p_picks -> i;
    v_w := (v_pick ->> 'w')::uuid;
    v_l := (v_pick ->> 'l')::uuid;
    if v_w is null or v_l is null or v_w = v_l then return jsonb_build_object('error', 'bad_bracket'); end if;
    v_posts := v_posts || v_w || v_l;
    v_last_w := v_w;
  end loop;
  if v_last_w <> p_winner then return jsonb_build_object('error', 'bad_bracket'); end if;
  -- 모든 등장 포스트가 이벤트 아카이브 집합의 공개 영상인지
  if exists (
    select 1 from unnest(v_posts) u(pid)
    left join stage_posts sp
      on sp.id = u.pid and sp.hidden = false
     and sp.stage_id in (select stage_id from stage_event_stages where event_id = p_event)
    where sp.id is null
  ) then return jsonb_build_object('error', 'bad_bracket'); end if;

  select count(*) into v_prev from worldcup_runs where event_id = p_event and user_id = p_user and counted;
  v_counted := v_prev < 3;

  insert into worldcup_runs (event_id, user_id, winner_post, picks, counted)
  values (p_event, p_user, p_winner, p_picks, v_counted);

  if v_counted then
    insert into worldcup_stats (event_id, post_id, runs_appeared)
    select p_event, pid, 1 from (select distinct unnest(v_posts) as pid) d
    on conflict (event_id, post_id) do update set runs_appeared = worldcup_stats.runs_appeared + 1;
    for i in 0 .. v_n - 1 loop
      v_pick := p_picks -> i;
      update worldcup_stats set match_wins = match_wins + 1 where event_id = p_event and post_id = (v_pick ->> 'w')::uuid;
      update worldcup_stats set match_losses = match_losses + 1 where event_id = p_event and post_id = (v_pick ->> 'l')::uuid;
    end loop;
    update worldcup_stats set final_wins = final_wins + 1 where event_id = p_event and post_id = p_winner;
  end if;
  return jsonb_build_object('counted', v_counted);
end $$;
revoke execute on function worldcup_submit_run(uuid, text, jsonb, uuid) from public, anon, authenticated;
grant  execute on function worldcup_submit_run(uuid, text, jsonb, uuid) to service_role;

-- 아티스트 픽 저장 — 이벤트 아카이브 집합의 공개 영상만
create or replace function member_set_pick(p_event uuid, p_member text, p_post uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_status text;
begin
  if not exists (select 1 from stage_members where user_id = p_member) then
    return jsonb_build_object('error', 'not_member');
  end if;
  select status into v_status from stage_events where id = p_event;
  if v_status is null or v_status <> 'open' then return jsonb_build_object('error', 'closed'); end if;
  if not exists (
    select 1 from stage_posts
    where id = p_post and hidden = false
      and stage_id in (select stage_id from stage_event_stages where event_id = p_event)
  ) then
    return jsonb_build_object('error', 'not_found');
  end if;
  insert into member_event_picks (event_id, member_id, post_id) values (p_event, p_member, p_post)
  on conflict (event_id, member_id) do update set post_id = excluded.post_id, created_at = now();
  return jsonb_build_object('ok', true);
end $$;
revoke execute on function member_set_pick(uuid, text, uuid) from public, anon, authenticated;
grant  execute on function member_set_pick(uuid, text, uuid) to service_role;
