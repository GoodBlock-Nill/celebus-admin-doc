-- 030: 대시보드에 리플레이 거부 활성 모드 노출(additive 필드) — 자동화 현재 상태 표시.
create or replace function admin_game_stats()
returns jsonb language sql security definer set search_path = public, extensions as $$
  with today as (select (now() at time zone 'Asia/Seoul')::date as d)
  select jsonb_build_object(
    'profiles_total', (select count(*) from game_profiles),
    'profiles_today', (select count(*) from game_profiles, today where (created_at at time zone 'Asia/Seoul')::date = d),
    'scores_total',   (select count(*) from game_scores),
    'scores_today',   (select count(*) from game_scores, today where (created_at at time zone 'Asia/Seoul')::date = d),
    'players_today',  (select count(distinct player_hash) from game_scores, today where (created_at at time zone 'Asia/Seoul')::date = d),
    'cp_minted',      (select coalesce(sum(delta), 0) from game_point_ledger where delta > 0),
    'cp_burned',      (select coalesce(-sum(delta), 0) from game_point_ledger where delta < 0),
    'daily_claims_today', (select count(*) from game_daily_claim, today where last_claim_date = d),
    'funnel_today',   (select coalesce(jsonb_object_agg(step, count), '{}'::jsonb) from game_funnel, today where day = d),
    'd1_cohort',      (select count(*) from game_profiles, today where (created_at at time zone 'Asia/Seoul')::date = d - 1),
    'd1_returned',    (select count(*) from game_profiles p, today
                        where (p.created_at at time zone 'Asia/Seoul')::date = d - 1
                          and exists (select 1 from game_scores s where s.player_hash = p.player_hash
                                        and (s.created_at at time zone 'Asia/Seoul')::date = d)),
    'flagged_total',  (select count(distinct player_hash) from game_scores where flagged),
    'replay_mismatch_week', (select count(*) from game_admin_log where action = 'replay_mismatch' and created_at >= now() - interval '7 days'),
    'replay_enforce_modes', coalesce((select config -> 'integrity' -> 'replayEnforceModes' from game_config where id = 1), '[]'::jsonb)
  );
$$;
