-- ─────────────────────────────────────────────────────────────
-- 028: Wave G — 좌절 데이터 계측 (피로감 개선 트랙 1단계)
--   배경: 유저 피드백 "며칠 하니 피로 누적·의욕 저하" → 좌절 구간을 감이 아닌 데이터로
--   찾아 레벨 곡선(levels.*)을 상시 튜닝하는 운영 루프의 계측 기반.
--   ① game_match에 종료 텔레메트리 3필드 — 제출 라우트가 기록(game_submit_score 무변경)
--   ② admin_balance_stats(p_days): 레벨 퍼널·near-miss율·이탈률·이어하기·재도전 체인·판수 추이
--   공유 DB 수칙: 순수 additive — 구 클라이언트·현행 프로드 경로 무영향.
-- ─────────────────────────────────────────────────────────────

alter table game_match add column if not exists end_reason     text;    -- 'timeout' | 'continue_declined' (제출 판만)
alter table game_match add column if not exists continues_used int;     -- 이어하기 사용 수
alter table game_match add column if not exists level_progress numeric; -- 종료 시점 현재 레벨 목표 진행도 0~1

create or replace function admin_balance_stats(p_days int default 7)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  -- KST 기준 p_days일 전 00:00부터 집계
  v_from     timestamptz := (date_trunc('day', now() at time zone 'Asia/Seoul') - make_interval(days => greatest(p_days, 1) - 1)) at time zone 'Asia/Seoul';
  v_levels   jsonb; v_abandon jsonb; v_continue jsonb;
  v_chains   jsonb; v_daily   jsonb; v_coverage jsonb;
begin
  -- ① 종료 레벨 분포 + near-miss(진행도 80% 이상에서 종료) — 좌절 최대 구간 탐지
  select coalesce(jsonb_agg(jsonb_build_object('mode', mode, 'level', level, 'runs', runs, 'near', near, 'avg_prog', avg_prog) order by mode, level), '[]'::jsonb)
    into v_levels
  from (
    select s.mode, s.level, count(*)::int as runs,
           count(*) filter (where m.level_progress >= 0.8)::int as near,
           round(avg(m.level_progress)::numeric, 2) as avg_prog
    from game_scores s left join game_match m on m.match_id = s.match_id
    where s.created_at >= v_from
    group by s.mode, s.level
  ) t;

  -- ② 이탈률 — 시작(match 발급) 후 미제출. 진행 중일 수 있는 최근 10분은 제외
  select coalesce(jsonb_agg(jsonb_build_object('day', day, 'mode', mode, 'started', started, 'abandoned', abandoned) order by day, mode), '[]'::jsonb)
    into v_abandon
  from (
    select to_char(issued_at at time zone 'Asia/Seoul', 'MM.DD') as day, mode,
           count(*)::int as started,
           count(*) filter (where not submitted)::int as abandoned
    from game_match
    where issued_at >= v_from and issued_at < now() - interval '10 minutes'
    group by 1, 2
  ) t;

  -- ③ 이어하기(일반 매치) — 사용/거절/평균 사용 수. "더 해봤자" 포기 심리의 지표
  select jsonb_build_object(
           'used',          count(*) filter (where coalesce(m.continues_used, 0) > 0)::int,
           'declined',      count(*) filter (where m.end_reason = 'continue_declined')::int,
           'timeout',       count(*) filter (where m.end_reason = 'timeout')::int,
           'avg_continues', round(coalesce(avg(m.continues_used) filter (where m.continues_used > 0), 0)::numeric, 2))
    into v_continue
  from game_scores s join game_match m on m.match_id = s.match_id
  where s.created_at >= v_from and s.mode = 'daily';

  -- ④ 재도전 체인 — 동일 유저 10분 내 연속 판수 분포(일반 매치). 긴 체인 다수 = "한판만 더" 압박 과열
  with runs as (
    select player_hash, created_at,
           case when created_at - lag(created_at) over (partition by player_hash order by created_at) <= interval '10 minutes'
                then 0 else 1 end as brk
    from game_scores
    where created_at >= v_from and mode = 'daily'
  ), grp as (
    select player_hash, sum(brk) over (partition by player_hash order by created_at) as g
    from runs
  ), lens as (
    select count(*)::int as len from grp group by player_hash, g
  )
  select coalesce(jsonb_agg(jsonb_build_object('len', len, 'chains', chains) order by len), '[]'::jsonb)
    into v_chains
  from (select least(len, 10) as len, count(*)::int as chains from lens group by 1) t;

  -- ⑤ 일 활성·판수 추이 — 판수 급감 코호트 = 피로 이탈 전조
  select coalesce(jsonb_agg(jsonb_build_object('day', day, 'players', players, 'runs', runs) order by day), '[]'::jsonb)
    into v_daily
  from (
    select to_char(created_at at time zone 'Asia/Seoul', 'MM.DD') as day,
           count(distinct player_hash)::int as players, count(*)::int as runs
    from game_scores where created_at >= v_from group by 1
  ) t;

  -- ⑥ 텔레메트리 커버리지 — 신형 클라 제출부터 기록되므로 표본 크기를 UI에 노출
  select jsonb_build_object('total', count(*)::int, 'with_telemetry', count(*) filter (where m.end_reason is not null)::int)
    into v_coverage
  from game_scores s left join game_match m on m.match_id = s.match_id
  where s.created_at >= v_from;

  return jsonb_build_object('days', p_days, 'levels', v_levels, 'abandon', v_abandon,
                            'cont', v_continue, 'chains', v_chains, 'daily', v_daily, 'coverage', v_coverage);
end $$;

revoke execute on function admin_balance_stats(int) from public, anon, authenticated;
grant  execute on function admin_balance_stats(int) to service_role;
