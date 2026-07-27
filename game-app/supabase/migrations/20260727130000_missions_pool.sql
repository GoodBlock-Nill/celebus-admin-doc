-- ─────────────────────────────────────────────────────────────
-- 019: 데일리 미션 다양화 — 풀에서 매일 3종 로테이션 (KST 날짜 결정론 선택)
--   풀 6종: plays(판수) score(누적점수) level(최고레벨) high(한판최고) item(아이템판) normal(일반판)
--   목표·보상·풀 = game_config.missions(pool[], count). 폴백 = 기본 풀. 선택 = md5(day||id) 최소 N.
--   status/claim 모두 동일 선택 로직 사용 → 오늘 활성 미션만 진행/수령 가능. 중복 수령 PK 차단.
-- ─────────────────────────────────────────────────────────────

-- 오늘 진행도 — 풀에서 선택된 N종만 반환
create or replace function game_mission_status(p_h text)
returns jsonb
language plpgsql stable security definer set search_path = public, extensions as $$
declare
  v_day  date := (now() at time zone 'Asia/Seoul')::date;
  v_from timestamptz := (v_day::timestamp) at time zone 'Asia/Seoul';
  v_cfg  jsonb := coalesce((select config -> 'missions' from game_config where id = 1), '{}'::jsonb);
  v_pool jsonb := coalesce(v_cfg -> 'pool', '[
    {"id":"plays","goal":3,"cp":20},{"id":"score","goal":2000,"cp":20},{"id":"level","goal":3,"cp":30},
    {"id":"high","goal":1500,"cp":20},{"id":"item","goal":2,"cp":20},{"id":"normal","goal":2,"cp":20}]'::jsonb);
  v_count int := coalesce((v_cfg ->> 'count')::int, 3);
  v_plays int; v_score int; v_level int; v_high int; v_item int; v_normal int;
  v_out jsonb := '[]'::jsonb;
  r record; v_val int;
begin
  select count(*), coalesce(sum(score), 0), coalesce(max(level), 0), coalesce(max(score), 0),
         count(*) filter (where mode = 'free'), count(*) filter (where mode = 'daily')
  into v_plays, v_score, v_level, v_high, v_item, v_normal
  from game_scores where player_hash = p_h and created_at >= v_from;

  for r in
    select (e ->> 'id') as id, coalesce((e ->> 'goal')::int, 1) as goal, coalesce((e ->> 'cp')::int, 10) as cp
    from jsonb_array_elements(v_pool) e
    order by md5(v_day::text || (e ->> 'id')) limit greatest(v_count, 1)
  loop
    v_val := case r.id
      when 'plays' then v_plays when 'score' then v_score when 'level' then v_level
      when 'high' then v_high when 'item' then v_item when 'normal' then v_normal else 0 end;
    v_out := v_out || jsonb_build_array(jsonb_build_object(
      'id', r.id, 'value', v_val, 'goal', r.goal, 'cp', r.cp,
      'claimed', exists (select 1 from game_mission_claim where player_hash = p_h and day = v_day and mission = r.id)));
  end loop;

  -- 하위호환: 미배포 구 클라이언트(plays/score/level 3종 고정 기대)를 위해 레거시 키 병행 반환.
  -- 신 클라이언트는 'missions' 배열만 사용. 신 코드 배포 안정화 후 별도 마이그레이션으로 레거시 키 제거.
  return jsonb_build_object('day', v_day, 'missions', v_out,
    'plays', jsonb_build_object('value', v_plays,
      'goal', coalesce((v_cfg->'legacy'->>'plays')::int, 3), 'cp', coalesce((v_cfg->'legacy'->>'playsCp')::int, 20),
      'claimed', exists (select 1 from game_mission_claim where player_hash = p_h and day = v_day and mission = 'plays')),
    'score', jsonb_build_object('value', v_score,
      'goal', coalesce((v_cfg->'legacy'->>'totalScore')::int, 2000), 'cp', coalesce((v_cfg->'legacy'->>'scoreCp')::int, 20),
      'claimed', exists (select 1 from game_mission_claim where player_hash = p_h and day = v_day and mission = 'score')),
    'level', jsonb_build_object('value', v_level,
      'goal', coalesce((v_cfg->'legacy'->>'bestLevel')::int, 3), 'cp', coalesce((v_cfg->'legacy'->>'levelCp')::int, 30),
      'claimed', exists (select 1 from game_mission_claim where player_hash = p_h and day = v_day and mission = 'level')));
end $$;

-- 수령 — 오늘 활성 미션인지 재확인 + 달성 재검증 후 지급
create or replace function game_mission_claim_reward(p_h text, p_mission text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_day  date := (now() at time zone 'Asia/Seoul')::date;
  v_from timestamptz := (v_day::timestamp) at time zone 'Asia/Seoul';
  v_cfg  jsonb := coalesce((select config -> 'missions' from game_config where id = 1), '{}'::jsonb);
  v_pool jsonb := coalesce(v_cfg -> 'pool', '[
    {"id":"plays","goal":3,"cp":20},{"id":"score","goal":2000,"cp":20},{"id":"level","goal":3,"cp":30},
    {"id":"high","goal":1500,"cp":20},{"id":"item","goal":2,"cp":20},{"id":"normal","goal":2,"cp":20}]'::jsonb);
  v_count int := coalesce((v_cfg ->> 'count')::int, 3);
  v_goal int; v_cp int; v_val int; v_bal int;
begin
  -- 오늘 활성 미션인지 + 목표·보상 조회
  select coalesce((e ->> 'goal')::int, 1), coalesce((e ->> 'cp')::int, 10)
  into v_goal, v_cp
  from (
    select e from jsonb_array_elements(v_pool) e
    order by md5(v_day::text || (e ->> 'id')) limit greatest(v_count, 1)
  ) s(e)
  where (e ->> 'id') = p_mission;

  -- 하위호환: 레거시 3종(plays/score/level)은 로테이션 밖이어도 수령 허용(구 클라이언트 보호)
  if not found and p_mission in ('plays', 'score', 'level') then
    select coalesce((e ->> 'goal')::int, 1), coalesce((e ->> 'cp')::int, 10)
    into v_goal, v_cp
    from jsonb_array_elements(v_pool) e where (e ->> 'id') = p_mission;
  end if;
  if v_goal is null then return jsonb_build_object('error', 'bad_mission'); end if;

  v_val := case p_mission
    when 'plays'  then (select count(*)::int from game_scores where player_hash = p_h and created_at >= v_from)
    when 'score'  then (select coalesce(sum(score), 0)::int from game_scores where player_hash = p_h and created_at >= v_from)
    when 'level'  then (select coalesce(max(level), 0)::int from game_scores where player_hash = p_h and created_at >= v_from)
    when 'high'   then (select coalesce(max(score), 0)::int from game_scores where player_hash = p_h and created_at >= v_from)
    when 'item'   then (select count(*)::int from game_scores where player_hash = p_h and created_at >= v_from and mode = 'free')
    when 'normal' then (select count(*)::int from game_scores where player_hash = p_h and created_at >= v_from and mode = 'daily')
    else 0 end;

  if v_val < v_goal then return jsonb_build_object('error', 'not_achieved'); end if;

  begin
    insert into game_mission_claim (player_hash, day, mission, cp) values (p_h, v_day, p_mission, v_cp);
  exception when unique_violation then
    return jsonb_build_object('error', 'already_claimed');
  end;

  insert into game_wallet (player_hash, celeb_point) values (p_h, v_cp)
  on conflict (player_hash) do update
    set celeb_point = game_wallet.celeb_point + excluded.celeb_point, updated_at = now();
  insert into game_point_ledger (player_hash, delta, reason)
  values (p_h, v_cp, 'mission:' || v_day || ':' || p_mission);

  select celeb_point into v_bal from game_wallet where player_hash = p_h;
  return jsonb_build_object('ok', true, 'cp', v_cp, 'celeb_point', coalesce(v_bal, 0));
end $$;

revoke execute on function game_mission_status(text) from public, anon, authenticated;
revoke execute on function game_mission_claim_reward(text, text) from public, anon, authenticated;
grant  execute on function game_mission_status(text) to service_role;
grant  execute on function game_mission_claim_reward(text, text) to service_role;
