-- 029: 서버 리플레이 거부 자동 승격/롤백(2c 자동화) — 모드별 명백조작률 관찰 → 안전하면 거부 활성.
--   승격: 모드 X의 최근 7일 실게임(로그 有) ≥ minGames && 명백조작률 ≤ maxPct → X를 거부 활성 집합에 추가.
--   롤백(안전밸브): 활성 모드 X의 최근 1일 명백조작률이 maxPct×5 초과 → X 제거(엔진 어긋남 방어).
--   전체 무인 동작. 모든 전환은 game_admin_log(actor=system)에 기록. 라우트가 샘플링해 호출.
create or replace function game_replay_autotune()
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_ig    jsonb := coalesce((select config -> 'integrity' from game_config where id = 1), '{}'::jsonb);
  v_auto  boolean := coalesce((v_ig ->> 'replayAutoEnable')::boolean, true);
  v_min   int := coalesce((v_ig ->> 'replayMinGamesPerMode')::int, 200);
  v_maxp  numeric := coalesce((v_ig ->> 'replayMaxMismatchPct')::numeric, 1);
  v_modes text[] := coalesce((select array_agg(value::text) from jsonb_array_elements_text(coalesce(v_ig -> 'replayEnforceModes', '[]'::jsonb)) value), array[]::text[]);
  m text;
  v_n int; v_bad int; v_rate numeric;
  v_n1 int; v_bad1 int; v_rate1 numeric;
  v_changed boolean := false;
begin
  if not v_auto then return jsonb_build_object('auto', false); end if;

  foreach m in array array['daily', 'free'] loop
    -- 7일 관찰: 로그 있는 실게임 수 / 명백조작(egregious) 수
    select count(*) into v_n from game_match
      where submitted and moves is not null and mode = m and submitted_at >= now() - interval '7 days';
    select count(*) into v_bad from game_admin_log
      where action = 'replay_mismatch' and (detail ->> 'egregious')::boolean and detail ->> 'mode' = m
        and created_at >= now() - interval '7 days';
    v_rate := case when v_n > 0 then v_bad::numeric * 100 / v_n else 100 end;

    if not (m = any(v_modes)) then
      -- 승격 조건: 충분한 관찰 + 낮은 명백조작률
      if v_n >= v_min and v_rate <= v_maxp then
        v_modes := array_append(v_modes, m);
        v_changed := true;
        insert into game_admin_log (action, target, detail, actor)
        values ('replay_enforce_on', null, jsonb_build_object('mode', m, 'games_7d', v_n, 'mismatch_pct', round(v_rate, 2)), 'system');
      end if;
    else
      -- 안전밸브: 최근 1일 명백조작률 급등 시 롤백
      select count(*) into v_n1 from game_match
        where submitted and moves is not null and mode = m and submitted_at >= now() - interval '1 day';
      select count(*) into v_bad1 from game_admin_log
        where action = 'replay_mismatch' and (detail ->> 'egregious')::boolean and detail ->> 'mode' = m
          and created_at >= now() - interval '1 day';
      v_rate1 := case when v_n1 > 0 then v_bad1::numeric * 100 / v_n1 else 0 end;
      if v_n1 >= 20 and v_rate1 > v_maxp * 5 then
        v_modes := array_remove(v_modes, m);
        v_changed := true;
        insert into game_admin_log (action, target, detail, actor)
        values ('replay_enforce_off', null, jsonb_build_object('mode', m, 'games_1d', v_n1, 'mismatch_pct', round(v_rate1, 2)), 'system');
      end if;
    end if;
  end loop;

  if v_changed then
    update game_config
      set config = coalesce(config, '{}'::jsonb)
        || jsonb_build_object('integrity', coalesce(config -> 'integrity', '{}'::jsonb) || jsonb_build_object('replayEnforceModes', to_jsonb(v_modes))),
        updated_at = now()
      where id = 1;
    if not found then
      insert into game_config (id, config) values (1, jsonb_build_object('integrity', jsonb_build_object('replayEnforceModes', to_jsonb(v_modes))));
    end if;
  end if;

  return jsonb_build_object('modes', to_jsonb(v_modes), 'changed', v_changed);
end $$;
revoke execute on function game_replay_autotune() from public, anon, authenticated;
grant  execute on function game_replay_autotune() to service_role;
