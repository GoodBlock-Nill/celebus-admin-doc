-- ─────────────────────────────────────────────────────────────
-- 014: Wave C-1 — 데일리 미션 (KST 일 리셋, 서버 데이터로만 검증)
--  M plays: 오늘 N판 / M score: 오늘 누적 점수 / M level: 오늘 최고 레벨
--  목표·보상 = game_config missions (폴백 = 코드 기본). 달성 → 받기(claim) 시 CP 지급.
--  game_mission_claim PK(player, day, mission)로 중복 수령 차단. 원장 reason 'mission:...'.
-- ─────────────────────────────────────────────────────────────

create table if not exists game_mission_claim (
  player_hash text not null,
  day         date not null,             -- KST 일자
  mission     text not null,             -- plays / score / level
  cp          int  not null,
  created_at  timestamptz not null default now(),
  primary key (player_hash, day, mission)
);
alter table game_mission_claim enable row level security; -- service_role 전용

-- 오늘 진행도 + 목표 + 수령 여부
create or replace function game_mission_status(p_h text)
returns jsonb
language plpgsql stable security definer set search_path = public, extensions as $$
declare
  v_day date := (now() at time zone 'Asia/Seoul')::date;
  v_from timestamptz := (v_day::timestamp) at time zone 'Asia/Seoul';
  v_cfg jsonb := coalesce((select config -> 'missions' from game_config where id = 1), '{}'::jsonb);
  v_plays int; v_score int; v_level int;
begin
  select count(*), coalesce(sum(score), 0), coalesce(max(level), 0)
  into v_plays, v_score, v_level
  from game_scores where player_hash = p_h and created_at >= v_from;

  return jsonb_build_object(
    'day', v_day,
    'plays', jsonb_build_object(
      'value', v_plays,
      'goal', coalesce((v_cfg ->> 'plays')::int, 3),
      'cp',   coalesce((v_cfg ->> 'playsCp')::int, 20),
      'claimed', exists (select 1 from game_mission_claim where player_hash = p_h and day = v_day and mission = 'plays')),
    'score', jsonb_build_object(
      'value', v_score,
      'goal', coalesce((v_cfg ->> 'totalScore')::int, 2000),
      'cp',   coalesce((v_cfg ->> 'scoreCp')::int, 20),
      'claimed', exists (select 1 from game_mission_claim where player_hash = p_h and day = v_day and mission = 'score')),
    'level', jsonb_build_object(
      'value', v_level,
      'goal', coalesce((v_cfg ->> 'bestLevel')::int, 3),
      'cp',   coalesce((v_cfg ->> 'levelCp')::int, 30),
      'claimed', exists (select 1 from game_mission_claim where player_hash = p_h and day = v_day and mission = 'level'))
  );
end $$;

-- 수령 — 서버가 달성 재검증 후 지급 (중복은 PK 차단)
create or replace function game_mission_claim_reward(p_h text, p_mission text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_day date := (now() at time zone 'Asia/Seoul')::date;
  v_from timestamptz := (v_day::timestamp) at time zone 'Asia/Seoul';
  v_cfg jsonb := coalesce((select config -> 'missions' from game_config where id = 1), '{}'::jsonb);
  v_value int; v_goal int; v_cp int; v_bal int;
begin
  if p_mission = 'plays' then
    select count(*) into v_value from game_scores where player_hash = p_h and created_at >= v_from;
    v_goal := coalesce((v_cfg ->> 'plays')::int, 3);
    v_cp := coalesce((v_cfg ->> 'playsCp')::int, 20);
  elsif p_mission = 'score' then
    select coalesce(sum(score), 0) into v_value from game_scores where player_hash = p_h and created_at >= v_from;
    v_goal := coalesce((v_cfg ->> 'totalScore')::int, 2000);
    v_cp := coalesce((v_cfg ->> 'scoreCp')::int, 20);
  elsif p_mission = 'level' then
    select coalesce(max(level), 0) into v_value from game_scores where player_hash = p_h and created_at >= v_from;
    v_goal := coalesce((v_cfg ->> 'bestLevel')::int, 3);
    v_cp := coalesce((v_cfg ->> 'levelCp')::int, 30);
  else
    return jsonb_build_object('error', 'bad_mission');
  end if;

  if v_value < v_goal then return jsonb_build_object('error', 'not_achieved'); end if;

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
