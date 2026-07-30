-- 023: 토너먼트 대상 범위 — 카테고리 스코프 + 공식/팬 구분 노출
-- source(팬영상/공식영상)는 아카이브의 is_official로 파생.
-- category: 공식영상 토너먼트에서 전체(null) 또는 특정 카테고리(예: 'azit')로 대상 한정.

alter table stage_events add column if not exists category text; -- null=아카이브 전체, 값=해당 카테고리만

-- 공개 뷰 갱신 — 기존 15개 컬럼 순서 보존 + 끝에 category, stage_is_official 추가
create or replace view stage_events_public as
  select e.id, e.stage_id, s.title as stage_title, e.title, e.description, e.status, e.ends_at, e.awards, e.created_at,
         e.type, e.submit_start_at, e.submit_end_at, e.rewards,
         e.reward_type, e.reward,
         e.category, s.is_official as stage_is_official
  from stage_events e
  join stages s on s.id = e.stage_id and s.hidden = false
  where e.status in ('open', 'announced');
grant select on stage_events_public to anon, authenticated;

-- 월드컵 런 제출 — 스테이지 소속 + (카테고리 지정 시) 카테고리 일치까지 검증
create or replace function worldcup_submit_run(p_event uuid, p_user text, p_picks jsonb, p_winner uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_stage uuid; v_status text; v_category text; v_counted boolean; v_prev int; v_n int;
  v_pick jsonb; v_w uuid; v_l uuid; v_last_w uuid;
  v_posts uuid[];
begin
  select stage_id, status, category into v_stage, v_status, v_category from stage_events where id = p_event;
  if v_stage is null or v_status <> 'open' then return jsonb_build_object('error', 'closed'); end if;

  v_n := jsonb_array_length(p_picks);
  if v_n not in (1, 3, 7, 15, 31) then return jsonb_build_object('error', 'bad_bracket'); end if;

  -- 모든 등장 포스트가 이 스테이지(+카테고리 지정 시 해당 카테고리)의 공개 영상인지 + 마지막 승자 = 최종 우승 확인
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
      and (v_category is null or sp.category = v_category)
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
