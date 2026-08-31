-- 047: 미션 보상에 드로우 티켓 추가 — 리텐션 트랙(주간 리뷰 2026-08-31 개선안 ②)
--   풀 항목에 선택 필드 tickets(기본 0) — 미션 수령 시 CP와 함께 무상 드로우 티켓 지급.
--   "매일 접속→미션→티켓→뽑기" 루프로 뽑기 동기를 게임 플레이로 환류시킨다.
--   두 RPC 모두 시그니처·기존 반환 키 유지(순수 additive) — 구 클라이언트 무영향.

create or replace function game_mission_status(p_h text)
returns jsonb
language plpgsql stable security definer set search_path = public, extensions as $$
declare
  v_day  date := (now() at time zone 'Asia/Seoul')::date;
  v_from timestamptz := (v_day::timestamp) at time zone 'Asia/Seoul';
  v_cfg  jsonb := coalesce((select config -> 'missions' from game_config where id = 1), '{}'::jsonb);
  v_pool jsonb := coalesce(v_cfg -> 'pool', '[
    {"id":"plays","goal":3,"cp":20},{"id":"score","goal":2000,"cp":20},{"id":"level","goal":3,"cp":30},
    {"id":"high","goal":1500,"cp":20},{"id":"item","goal":2,"cp":20},{"id":"normal","goal":2,"cp":20},
    {"id":"sketch_draw","goal":1,"cp":20},{"id":"sketch_guess","goal":3,"cp":20}]'::jsonb);
  v_count int := coalesce((v_cfg ->> 'count')::int, 3);
  v_plays int; v_score int; v_level int; v_high int; v_item int; v_normal int;
  v_sk_draw int; v_sk_guess int;
  v_out jsonb := '[]'::jsonb;
  r record; v_val int;
begin
  select count(*), coalesce(sum(score), 0), coalesce(max(level), 0), coalesce(max(score), 0),
         count(*) filter (where mode = 'free'), count(*) filter (where mode = 'daily')
  into v_plays, v_score, v_level, v_high, v_item, v_normal
  from game_scores where player_hash = p_h and created_at >= v_from;

  select count(*) into v_sk_draw
  from game_sketch_drawing where player_hash = p_h and created_at >= v_from and status <> 'rejected';
  select count(*) into v_sk_guess
  from game_sketch_guess where player_hash = p_h and correct and updated_at >= v_from;

  for r in
    select (e ->> 'id') as id, coalesce((e ->> 'goal')::int, 1) as goal, coalesce((e ->> 'cp')::int, 10) as cp,
           coalesce((e ->> 'tickets')::int, 0) as tickets
    from jsonb_array_elements(v_pool) e
    order by md5(v_day::text || (e ->> 'id')) limit greatest(v_count, 1)
  loop
    v_val := case r.id
      when 'plays' then v_plays when 'score' then v_score when 'level' then v_level
      when 'high' then v_high when 'item' then v_item when 'normal' then v_normal
      when 'sketch_draw' then v_sk_draw when 'sketch_guess' then v_sk_guess else 0 end;
    v_out := v_out || jsonb_build_array(jsonb_build_object(
      'id', r.id, 'value', v_val, 'goal', r.goal, 'cp', r.cp, 'tickets', r.tickets,
      'claimed', exists (select 1 from game_mission_claim where player_hash = p_h and day = v_day and mission = r.id)));
  end loop;

  -- 하위호환 레거시 키 유지 (구 클라이언트)
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

create or replace function game_mission_claim_reward(p_h text, p_mission text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_day  date := (now() at time zone 'Asia/Seoul')::date;
  v_from timestamptz := (v_day::timestamp) at time zone 'Asia/Seoul';
  v_cfg  jsonb := coalesce((select config -> 'missions' from game_config where id = 1), '{}'::jsonb);
  v_pool jsonb := coalesce(v_cfg -> 'pool', '[
    {"id":"plays","goal":3,"cp":20},{"id":"score","goal":2000,"cp":20},{"id":"level","goal":3,"cp":30},
    {"id":"high","goal":1500,"cp":20},{"id":"item","goal":2,"cp":20},{"id":"normal","goal":2,"cp":20},
    {"id":"sketch_draw","goal":1,"cp":20},{"id":"sketch_guess","goal":3,"cp":20}]'::jsonb);
  v_count int := coalesce((v_cfg ->> 'count')::int, 3);
  v_goal int; v_cp int; v_tk int; v_val int; v_bal int; v_free int;
begin
  select coalesce((e ->> 'goal')::int, 1), coalesce((e ->> 'cp')::int, 10), coalesce((e ->> 'tickets')::int, 0)
  into v_goal, v_cp, v_tk
  from (
    select e from jsonb_array_elements(v_pool) e
    order by md5(v_day::text || (e ->> 'id')) limit greatest(v_count, 1)
  ) s(e)
  where (e ->> 'id') = p_mission;

  if not found and p_mission in ('plays', 'score', 'level') then
    select coalesce((e ->> 'goal')::int, 1), coalesce((e ->> 'cp')::int, 10), coalesce((e ->> 'tickets')::int, 0)
    into v_goal, v_cp, v_tk
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
    when 'sketch_draw'  then (select count(*)::int from game_sketch_drawing where player_hash = p_h and created_at >= v_from and status <> 'rejected')
    when 'sketch_guess' then (select count(*)::int from game_sketch_guess where player_hash = p_h and correct and updated_at >= v_from)
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

  -- 드로우 티켓 지급 (풀 항목 tickets>0일 때) — 무상 지갑 적립 + 원장 기록
  if v_tk > 0 then
    insert into game_gacha_wallet (player_hash, free_tickets) values (p_h, v_tk)
    on conflict (player_hash) do update
      set free_tickets = game_gacha_wallet.free_tickets + excluded.free_tickets, updated_at = now();
    insert into game_gacha_ticket_ledger (player_hash, delta_free, reason)
    values (p_h, v_tk, 'mission:' || v_day || ':' || p_mission);
  end if;

  select celeb_point into v_bal from game_wallet where player_hash = p_h;
  select free_tickets into v_free from game_gacha_wallet where player_hash = p_h;
  return jsonb_build_object('ok', true, 'cp', v_cp, 'celeb_point', coalesce(v_bal, 0),
                            'tickets', v_tk, 'free_tickets', coalesce(v_free, 0));
end $$;

revoke execute on function game_mission_status(text) from public, anon, authenticated;
revoke execute on function game_mission_claim_reward(text, text) from public, anon, authenticated;
grant  execute on function game_mission_status(text) to service_role;
grant  execute on function game_mission_claim_reward(text, text) to service_role;
