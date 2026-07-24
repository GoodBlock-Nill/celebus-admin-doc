-- ─────────────────────────────────────────────────────────────
-- 011: 기간 랭킹 (주간/월간) — KST 기준, 주간 = 월요일 시작.
--  · 유저: game_leaderboard_period (anon 허용 — 공개 뷰와 동일 정보 수준)
--  · 유저: game_player_rank_period (서버 라우트 경유)
--  · 관리자: admin_leaderboard_preset (이번/지난 주·월 — 보상 이벤트 정산용, player_hash 포함)
-- ─────────────────────────────────────────────────────────────

-- 기간 경계 (KST 벽시계 → timestamptz). period: week / month / 그 외 = 전체
create or replace function game_period_bounds(p_period text)
returns table (t_from timestamptz, t_to timestamptz)
language sql stable as $$
  select
    case p_period
      when 'week'  then (date_trunc('week',  now() at time zone 'Asia/Seoul')) at time zone 'Asia/Seoul'
      when 'month' then (date_trunc('month', now() at time zone 'Asia/Seoul')) at time zone 'Asia/Seoul'
      else '-infinity'::timestamptz
    end,
    'infinity'::timestamptz;
$$;

-- 기간 리더보드 (상위 100) — (최고 레벨, 점수) 기준, 동률은 선도달 우선
create or replace function game_leaderboard_period(p_mode text, p_period text, p_limit int default 100)
returns jsonb
language sql stable security definer set search_path = public, extensions as $$
  with b as (select * from game_period_bounds(p_period)),
  best as (
    select distinct on (player_hash) player_hash, nickname, avatar, level, score, created_at
    from game_scores, b
    where mode = p_mode and created_at >= b.t_from and created_at < b.t_to
    order by player_hash, level desc, score desc, created_at asc
  )
  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
    select row_number() over (order by level desc, score desc, created_at asc) as rank,
           nickname, avatar, level, score
    from best
    order by level desc, score desc, created_at asc
    limit least(greatest(coalesce(p_limit, 100), 1), 100)
  ) t;
$$;
grant execute on function game_leaderboard_period(text, text, int) to anon, authenticated, service_role;

-- 기간 내 순위 (모드별) — 기존 game_player_rank와 동일 shape
create or replace function game_player_rank_period(p_player_hash text, p_period text)
returns jsonb
language plpgsql stable security definer set search_path = public, extensions as $$
declare
  v_from timestamptz; v_to timestamptz;
  v jsonb := '{}'::jsonb;
  r record;
begin
  select t_from, t_to into v_from, v_to from game_period_bounds(p_period);
  for r in
    with best as (
      select distinct on (player_hash, mode) player_hash, mode, level, score, created_at
      from game_scores
      where created_at >= v_from and created_at < v_to
      order by player_hash, mode, level desc, score desc, created_at asc
    )
    select m.mode,
           (select count(*) + 1 from best b where b.mode = m.mode and (b.level, b.score, -extract(epoch from b.created_at)) > (m.level, m.score, -extract(epoch from m.created_at))) as rank,
           (select count(*) from best b where b.mode = m.mode) as total,
           m.level as best_level
    from best m
    where m.player_hash = p_player_hash
  loop
    if r.mode = 'daily' then
      v := v || jsonb_build_object('normal_rank', r.rank, 'normal_total', r.total, 'normal_best_level', r.best_level);
    else
      v := v || jsonb_build_object('item_rank', r.rank, 'item_total', r.total, 'item_best_level', r.best_level);
    end if;
  end loop;
  return jsonb_build_object(
    'normal_rank', null, 'normal_total', null, 'normal_best_level', null,
    'item_rank', null, 'item_total', null, 'item_best_level', null
  ) || v;
end $$;
revoke execute on function game_player_rank_period(text, text) from public, anon, authenticated;
grant execute on function game_player_rank_period(text, text) to service_role;

-- 관리자: 기간 프리셋 리더보드 (보상 이벤트 정산 — player_hash 포함)
-- preset: this_week / last_week / this_month / last_month / all
create or replace function admin_leaderboard_preset(p_mode text, p_preset text, p_limit int default 100)
returns jsonb
language plpgsql stable security definer set search_path = public, extensions as $$
declare
  v_kst timestamp := now() at time zone 'Asia/Seoul';
  v_from timestamptz := '-infinity';
  v_to   timestamptz := 'infinity';
begin
  if p_preset = 'this_week' then
    v_from := date_trunc('week', v_kst) at time zone 'Asia/Seoul';
  elsif p_preset = 'last_week' then
    v_from := (date_trunc('week', v_kst) - interval '7 days') at time zone 'Asia/Seoul';
    v_to   := date_trunc('week', v_kst) at time zone 'Asia/Seoul';
  elsif p_preset = 'this_month' then
    v_from := date_trunc('month', v_kst) at time zone 'Asia/Seoul';
  elsif p_preset = 'last_month' then
    v_from := (date_trunc('month', v_kst) - interval '1 month') at time zone 'Asia/Seoul';
    v_to   := date_trunc('month', v_kst) at time zone 'Asia/Seoul';
  end if;

  return (
    with best as (
      select distinct on (player_hash) player_hash, nickname, avatar, level, score, created_at
      from game_scores
      where mode = p_mode and created_at >= v_from and created_at < v_to
      order by player_hash, level desc, score desc, created_at asc
    )
    select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
      select row_number() over (order by level desc, score desc, created_at asc) as rank,
             player_hash, nickname, avatar, level, score, created_at
      from best
      order by level desc, score desc, created_at asc
      limit least(greatest(coalesce(p_limit, 100), 1), 200)
    ) t
  );
end $$;
revoke execute on function admin_leaderboard_preset(text, text, int) from public, anon, authenticated;
grant execute on function admin_leaderboard_preset(text, text, int) to service_role;
