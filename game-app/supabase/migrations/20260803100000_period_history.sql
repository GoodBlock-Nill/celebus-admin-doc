-- ─────────────────────────────────────────────────────────────
-- 034: 지난 주간/월간 랭킹 열람 (앱 ◀▶ 기간 내비 + 관리자 과거 기간 — 사용자 요청)
--   오프셋 기반 기간 경계·리더보드·내순위·관리자 조회를 신설(additive — 기존 함수 무변경).
--   p_offset: 0=현재, 1=지난, 2=지지난 … (주=7일, 월=1개월 단위, KST)
-- ─────────────────────────────────────────────────────────────

create or replace function game_period_bounds_at(p_period text, p_offset int)
returns table (t_from timestamptz, t_to timestamptz)
language sql stable as $$
  with s as (
    select case p_period
      when 'week'  then date_trunc('week',  now() at time zone 'Asia/Seoul') - make_interval(weeks  => greatest(coalesce(p_offset, 0), 0))
      when 'month' then date_trunc('month', now() at time zone 'Asia/Seoul') - make_interval(months => greatest(coalesce(p_offset, 0), 0))
      else null end as st
  )
  select
    coalesce(st at time zone 'Asia/Seoul', '-infinity'::timestamptz),
    case when st is null then 'infinity'::timestamptz
         when p_period = 'week' then (st + interval '7 days') at time zone 'Asia/Seoul'
         else (st + interval '1 month') at time zone 'Asia/Seoul' end
  from s;
$$;

-- 기간 리더보드(오프셋) — game_leaderboard_period(멤버 병기 v2)와 동일 shape
create or replace function game_leaderboard_period_at(p_mode text, p_period text, p_offset int, p_limit int default 100)
returns jsonb language sql stable security definer set search_path = public, extensions as $$
  with b as (select * from game_period_bounds_at(p_period, p_offset)),
  best as (
    select distinct on (s.player_hash) s.player_hash, s.nickname, s.avatar, s.level, s.score, s.created_at
    from game_scores s, b
    where s.mode = p_mode and s.created_at >= b.t_from and s.created_at < b.t_to
    order by s.player_hash, s.level desc, s.score desc, s.created_at asc
  )
  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
    select row_number() over (order by best.level desc, best.score desc, best.created_at asc) as rank,
           best.nickname,
           case when coalesce(p.is_member, false)
                then (case when left(coalesce(p.avatar, ''), 4) = 'http' then p.avatar else coalesce(nullif(p.member_avatar, ''), p.avatar) end)
                else best.avatar end as avatar,
           best.level, best.score,
           coalesce(p.is_member, false) as member,
           case when coalesce(p.is_member, false) then member_name_obj(p.member_name, p.member_name_en, p.member_name_ja) else null end as member_name
    from best
    left join game_profiles p on p.player_hash = best.player_hash
    order by best.level desc, best.score desc, best.created_at asc
    limit least(greatest(coalesce(p_limit, 100), 1), 100)
  ) t;
$$;
grant execute on function game_leaderboard_period_at(text, text, int, int) to anon, authenticated, service_role;

-- 기간 내 순위(오프셋) — game_player_rank_period와 동일 shape
create or replace function game_player_rank_period_at(p_player_hash text, p_period text, p_offset int)
returns jsonb
language plpgsql stable security definer set search_path = public, extensions as $$
declare
  v_from timestamptz; v_to timestamptz;
  v jsonb := '{}'::jsonb;
  r record;
begin
  select t_from, t_to into v_from, v_to from game_period_bounds_at(p_period, p_offset);
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
revoke execute on function game_player_rank_period_at(text, text, int) from public, anon, authenticated;
grant execute on function game_player_rank_period_at(text, text, int) to service_role;

-- 관리자 기간 리더보드(오프셋) — player_hash·flagged·member 포함 (정산·운영용)
create or replace function admin_leaderboard_at(p_mode text, p_period text, p_offset int, p_limit int default 100)
returns jsonb language sql stable security definer set search_path = public, extensions as $$
  with b as (select * from game_period_bounds_at(p_period, p_offset)),
  best as (
    select distinct on (s.player_hash) s.player_hash, s.nickname, s.avatar, s.level, s.score, s.created_at
    from game_scores s, b
    where s.mode = p_mode and s.created_at >= b.t_from and s.created_at < b.t_to
    order by s.player_hash, s.level desc, s.score desc, s.created_at asc
  )
  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
    select row_number() over (order by level desc, score desc, created_at asc) as rank,
           player_hash, nickname, avatar, level, score, created_at,
           exists (select 1 from game_scores f where f.player_hash = best.player_hash and f.flagged) as flagged,
           coalesce((select is_member from game_profiles p where p.player_hash = best.player_hash), false) as member
    from best
    order by level desc, score desc, created_at asc
    limit least(greatest(coalesce(p_limit, 100), 1), 200)
  ) t;
$$;
revoke execute on function admin_leaderboard_at(text, text, int, int) from public, anon, authenticated;
grant execute on function admin_leaderboard_at(text, text, int, int) to service_role;

notify pgrst, 'reload schema';
