-- 011: 월드컵 이벤트 (FanStage 개편 W3)
-- 형식: 이상형월드컵 — 투표자마다 무작위 개인 대진표(1:1 대결)를 플레이해 "나의 우승작"을 뽑고,
--   집계는 우승 비율(1순위)·1:1 승률(2순위). 무작위 대진 = 노출 기회의 통계적 공평.
-- 이벤트는 스테이지(공연) 단위로 열리며 그 스테이지의 공개 영상 전체가 자동 출전(소급 포함).
-- 집계 반영은 신원당 3회/이벤트 캡(초과 플레이 허용·미집계) — 어뷰징 완화.

create table if not exists stage_events (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references stages(id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'open' check (status in ('open','announced','closed')),  -- open=플레이 / announced=결과 발표 / closed=종료·비노출
  ends_at timestamptz,                            -- 표기용 마감(플레이 차단은 status로)
  awards jsonb,                                   -- 발표 시 서버가 계산·저장 {fan:{post_id,title}, artist:{...}, uploader:{handle,days}}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table stage_events enable row level security;

create table if not exists worldcup_runs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references stage_events(id) on delete cascade,
  user_id text not null,
  winner_post uuid not null,
  picks jsonb not null,                           -- [{"w":uuid,"l":uuid}, ...] 검증·감사용
  counted boolean not null default true,
  created_at timestamptz not null default now()
);
alter table worldcup_runs enable row level security;
create index if not exists idx_wc_runs_user on worldcup_runs (event_id, user_id);

create table if not exists worldcup_stats (
  event_id uuid not null references stage_events(id) on delete cascade,
  post_id uuid not null references stage_posts(id) on delete cascade,
  runs_appeared int not null default 0,           -- 대진 등장 런 수 (우승 비율 분모)
  final_wins int not null default 0,              -- 개인 토너먼트 우승 수
  match_wins int not null default 0,
  match_losses int not null default 0,
  primary key (event_id, post_id)
);
alter table worldcup_stats enable row level security;

create table if not exists member_event_picks (
  event_id uuid not null references stage_events(id) on delete cascade,
  member_id text not null references stage_members(user_id) on delete cascade,
  post_id uuid not null references stage_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, member_id)
);
alter table member_event_picks enable row level security;

-- ── 공개 뷰 ─────────────────────────────────────────────

create or replace view stage_events_public as
  select e.id, e.stage_id, s.title as stage_title, e.title, e.description, e.status, e.ends_at, e.awards, e.created_at
  from stage_events e
  join stages s on s.id = e.stage_id and s.hidden = false
  where e.status in ('open','announced');
grant select on stage_events_public to anon, authenticated;

create or replace view worldcup_stats_public as
  select w.event_id, w.post_id, w.runs_appeared, w.final_wins, w.match_wins, w.match_losses,
         case when w.runs_appeared > 0 then round(w.final_wins::numeric / w.runs_appeared, 4) else 0 end as win_rate,
         case when (w.match_wins + w.match_losses) > 0 then round(w.match_wins::numeric / (w.match_wins + w.match_losses), 4) else 0 end as match_rate
  from worldcup_stats w
  join stage_events e on e.id = w.event_id and e.status in ('open','announced');
grant select on worldcup_stats_public to anon, authenticated;

-- 아티스트 픽 — 발표(announced) 후에만 공개 (비공개 진행 원칙)
create or replace view member_event_picks_public as
  select p.event_id, p.post_id, m.display_name, m.avatar_url
  from member_event_picks p
  join stage_members m on m.user_id = p.member_id
  join stage_events e on e.id = p.event_id and e.status = 'announced';
grant select on member_event_picks_public to anon, authenticated;

-- ── RPC ────────────────────────────────────────────────

-- 월드컵 런 제출 — 구조·소속 검증 + 신원당 3회 집계 캡. 반환 {counted}
create or replace function worldcup_submit_run(p_event uuid, p_user text, p_picks jsonb, p_winner uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_stage uuid; v_status text; v_counted boolean; v_prev int; v_n int;
  v_pick jsonb; v_w uuid; v_l uuid; v_last_w uuid;
  v_posts uuid[];
begin
  select stage_id, status into v_stage, v_status from stage_events where id = p_event;
  if v_stage is null or v_status <> 'open' then return jsonb_build_object('error', 'closed'); end if;

  v_n := jsonb_array_length(p_picks);
  if v_n not in (1, 3, 7, 15, 31) then return jsonb_build_object('error', 'bad_bracket'); end if;

  -- 모든 등장 포스트가 이 스테이지의 공개 영상인지 + 마지막 승자 = 최종 우승 확인
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
  if exists (
    select 1 from unnest(v_posts) u(pid)
    left join stage_posts sp on sp.id = u.pid and sp.stage_id = v_stage and sp.hidden = false
    where sp.id is null
  ) then return jsonb_build_object('error', 'bad_bracket'); end if;

  select count(*) into v_prev from worldcup_runs where event_id = p_event and user_id = p_user and counted;
  v_counted := v_prev < 3;

  insert into worldcup_runs (event_id, user_id, winner_post, picks, counted)
  values (p_event, p_user, p_winner, p_picks, v_counted);

  if v_counted then
    -- 등장(distinct)·승패·우승 집계
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

-- 아티스트 픽 저장 (멤버만, 이벤트 open 동안, 픽 교체 허용)
create or replace function member_set_pick(p_event uuid, p_member text, p_post uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_stage uuid; v_status text;
begin
  if not exists (select 1 from stage_members where user_id = p_member) then
    return jsonb_build_object('error', 'not_member');
  end if;
  select stage_id, status into v_stage, v_status from stage_events where id = p_event;
  if v_stage is null or v_status <> 'open' then return jsonb_build_object('error', 'closed'); end if;
  if not exists (select 1 from stage_posts where id = p_post and stage_id = v_stage and hidden = false) then
    return jsonb_build_object('error', 'not_found');
  end if;
  insert into member_event_picks (event_id, member_id, post_id) values (p_event, p_member, p_post)
  on conflict (event_id, member_id) do update set post_id = excluded.post_id, created_at = now();
  return jsonb_build_object('ok', true);
end $$;
revoke execute on function member_set_pick(uuid, text, uuid) from public, anon, authenticated;
grant  execute on function member_set_pick(uuid, text, uuid) to service_role;

-- 내 픽 조회 (서버 라우트 전용 — 멤버 본인)
create or replace function member_my_pick(p_event uuid, p_member text)
returns jsonb language sql security definer set search_path = public, extensions as $$
  select coalesce((select jsonb_build_object('post_id', post_id) from member_event_picks
                   where event_id = p_event and member_id = p_member), '{}'::jsonb);
$$;
revoke execute on function member_my_pick(uuid, text) from public, anon, authenticated;
grant  execute on function member_my_pick(uuid, text) to service_role;
