-- ─────────────────────────────────────────────────────────────
-- 041: 주간 밸런스 리포트 — 주간(KST 월~일) 지표 스냅샷 + 룰 기반 인사이트 저장.
--   관리자 "주간 리포트" 탭이 지난주 리포트가 없으면 생성해 저장한다 (크론 불필요, lazy 생성).
--   인사이트 판정은 서버 TS(룰 엔진)에서 수행하고 결과만 저장 — 룰 개정이 마이그레이션 없이 가능.
--   공유 DB 수칙: 순수 additive.
-- ─────────────────────────────────────────────────────────────

create table if not exists game_weekly_report (
  week_start date primary key,             -- KST 월요일
  metrics    jsonb not null,               -- 주간 지표 스냅샷 (admin_weekly_stats 결과)
  insights   jsonb not null default '[]',  -- [{level: 'warn'|'info'|'good', text}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table game_weekly_report enable row level security;

-- 주간 지표 집계 — [p_week_start 00:00 KST, +7일) 창. admin_balance_stats와 동일 계보의 지표를 주간 창으로.
create or replace function admin_weekly_stats(p_week_start date)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_from timestamptz := p_week_start::timestamp at time zone 'Asia/Seoul';
  v_to   timestamptz := (p_week_start + 7)::timestamp at time zone 'Asia/Seoul';
  v_players int; v_runs int; v_new int;
  v_abandon jsonb; v_cont jsonb; v_chains jsonb; v_levels jsonb; v_coverage jsonb;
begin
  -- 활성·판수
  select count(distinct player_hash), count(*) into v_players, v_runs
  from game_scores where created_at >= v_from and created_at < v_to;

  -- 신규 유저 — 이 주에 첫 제출
  select count(*) into v_new from (
    select player_hash, min(created_at) as first_at from game_scores group by player_hash
  ) f where f.first_at >= v_from and f.first_at < v_to;

  -- 이탈 — 시작(match 발급) 후 미제출 (진행 중일 수 있는 최근 10분 제외)
  select jsonb_build_object(
           'started',   count(*)::int,
           'abandoned', count(*) filter (where not submitted)::int)
    into v_abandon
  from game_match
  where issued_at >= v_from and issued_at < least(v_to, now() - interval '10 minutes');

  -- 이어하기 (일반 매치)
  select jsonb_build_object(
           'used',          count(*) filter (where coalesce(m.continues_used, 0) > 0)::int,
           'declined',      count(*) filter (where m.end_reason = 'continue_declined')::int,
           'timeout',       count(*) filter (where m.end_reason = 'timeout')::int,
           'avg_continues', round(coalesce(avg(m.continues_used) filter (where m.continues_used > 0), 0)::numeric, 2))
    into v_cont
  from game_scores s join game_match m on m.match_id = s.match_id
  where s.created_at >= v_from and s.created_at < v_to and s.mode = 'daily';

  -- 재도전 체인 (일반 매치, 10분 내 연속)
  with runs as (
    select player_hash, created_at,
           case when created_at - lag(created_at) over (partition by player_hash order by created_at) <= interval '10 minutes'
                then 0 else 1 end as brk
    from game_scores
    where created_at >= v_from and created_at < v_to and mode = 'daily'
  ), grp as (
    select player_hash, sum(brk) over (partition by player_hash order by created_at) as g from runs
  ), lens as (
    select count(*)::int as len from grp group by player_hash, g
  )
  select jsonb_build_object(
           'max_len',      coalesce(max(len), 0)::int,
           'total',        count(*)::int,
           'chains3plus',  count(*) filter (where len >= 3)::int)
    into v_chains
  from lens;

  -- 레벨 퍼널 + near-miss (진행도 80%+ 종료)
  select coalesce(jsonb_agg(jsonb_build_object('mode', mode, 'level', level, 'runs', runs, 'near', near, 'avg_prog', avg_prog) order by mode, level), '[]'::jsonb)
    into v_levels
  from (
    select s.mode, s.level, count(*)::int as runs,
           count(*) filter (where m.level_progress >= 0.8)::int as near,
           round(avg(m.level_progress)::numeric, 2) as avg_prog
    from game_scores s left join game_match m on m.match_id = s.match_id
    where s.created_at >= v_from and s.created_at < v_to
    group by s.mode, s.level
  ) t;

  -- 텔레메트리 커버리지
  select jsonb_build_object('total', count(*)::int, 'with_telemetry', count(*) filter (where m.end_reason is not null)::int)
    into v_coverage
  from game_scores s left join game_match m on m.match_id = s.match_id
  where s.created_at >= v_from and s.created_at < v_to;

  return jsonb_build_object(
    'week_start', p_week_start, 'players', v_players, 'runs', v_runs, 'new_players', v_new,
    'abandon', v_abandon, 'cont', v_cont, 'chains', v_chains, 'levels', v_levels, 'coverage', v_coverage);
end $$;

revoke execute on function admin_weekly_stats(date) from public, anon, authenticated;
grant  execute on function admin_weekly_stats(date) to service_role;
