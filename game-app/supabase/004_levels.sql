-- ─────────────────────────────────────────────────────────────
-- V01D POP (game-app) — 레벨 진행형 + 모드별 전체 랭킹  [레벨]
-- 001~003 이후 실행. Supabase SQL Editor에 통째로 붙여넣기 (재실행 안전).
-- 랭킹 = 모드별(normal=daily / item=free) 전체, (최고 레벨, 점수) 순.
-- ─────────────────────────────────────────────────────────────

-- 레벨 컬럼 (한 판에 도달한 최고 레벨)
alter table game_scores add column if not exists level int not null default 1 check (level >= 1);

-- 기존 일일/주간 뷰 제거(레벨형에선 사용 안 함)
drop view if exists game_daily_leaderboard;
drop view if exists game_weekly_leaderboard;

-- ── 모드별 전체 리더보드 (플레이어별 베스트 런 = (level,score) 사전식 최대) ──
create or replace view game_leaderboard_normal as
select row_number() over (order by level desc, score desc, first_at asc) as rank, avatar, nickname, level, score
from (
  select distinct on (player_hash) player_hash, level, score, created_at as first_at, nickname, avatar
  from game_scores
  where mode = 'daily'
  order by player_hash, level desc, score desc, created_at asc
) t
order by level desc, score desc, first_at asc
limit 100;

create or replace view game_leaderboard_item as
select row_number() over (order by level desc, score desc, first_at asc) as rank, avatar, nickname, level, score
from (
  select distinct on (player_hash) player_hash, level, score, created_at as first_at, nickname, avatar
  from game_scores
  where mode = 'free'
  order by player_hash, level desc, score desc, created_at asc
) t
order by level desc, score desc, first_at asc
limit 100;

grant select on game_leaderboard_normal, game_leaderboard_item to anon, authenticated;

-- ── 점수+레벨 제출 (시그니처 변경 → 옛 6-인자 함수 제거 후 재생성) — service_role 전용 ──
drop function if exists game_submit_score(text, text, text, text, bigint, int);

create or replace function game_submit_score(
  p_player_hash text, p_nickname text, p_avatar text, p_mode text, p_seed bigint, p_score int, p_level int
) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_nick   text := left(coalesce(nullif(trim(p_nickname), ''), '익명'), 16);
  v_av     text := left(nullif(trim(p_avatar), ''), 200);
  v_blevel int; v_bscore int;
  v_rank   int; v_total int;
begin
  if p_mode not in ('daily', 'free') then return jsonb_build_object('error', 'bad_mode'); end if;
  if p_score < 0 or p_score > 1000000 then return jsonb_build_object('error', 'bad_score'); end if;
  if p_level < 1 or p_level > 999 then return jsonb_build_object('error', 'bad_level'); end if;

  insert into game_scores (player_hash, nickname, avatar, mode, seed, score, level)
  values (p_player_hash, v_nick, v_av, p_mode, p_seed, p_score, p_level);

  with best as (
    select distinct on (player_hash) player_hash, level, score
    from game_scores where mode = p_mode
    order by player_hash, level desc, score desc, created_at asc
  ), me as (select level, score from best where player_hash = p_player_hash)
  select (select count(*) from best b cross join me where (b.level, b.score) > (me.level, me.score)) + 1,
         (select count(*) from best),
         (select level from me),
         (select score from me)
  into v_rank, v_total, v_blevel, v_bscore;

  return jsonb_build_object('rank', v_rank, 'total', v_total, 'best_level', v_blevel, 'best_score', v_bscore);
end $$;

revoke execute on function game_submit_score(text, text, text, text, bigint, int, int) from public, anon, authenticated;
grant  execute on function game_submit_score(text, text, text, text, bigint, int, int) to service_role;

-- ── 내 순위 (모드별 normal/item) — service_role 전용 ──
create or replace function game_player_rank(p_player_hash text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_nr int; v_nt int; v_nl int;
  v_ir int; v_it int; v_il int;
begin
  with best as (
    select distinct on (player_hash) player_hash, level, score
    from game_scores where mode = 'daily'
    order by player_hash, level desc, score desc, created_at asc
  ), me as (select level, score from best where player_hash = p_player_hash)
  select case when exists (select 1 from me)
              then (select count(*) from best b cross join me where (b.level, b.score) > (me.level, me.score)) + 1 end,
         (select count(*) from best),
         (select level from me)
  into v_nr, v_nt, v_nl;

  with best as (
    select distinct on (player_hash) player_hash, level, score
    from game_scores where mode = 'free'
    order by player_hash, level desc, score desc, created_at asc
  ), me as (select level, score from best where player_hash = p_player_hash)
  select case when exists (select 1 from me)
              then (select count(*) from best b cross join me where (b.level, b.score) > (me.level, me.score)) + 1 end,
         (select count(*) from best),
         (select level from me)
  into v_ir, v_it, v_il;

  return jsonb_build_object(
    'normal_rank', v_nr, 'normal_total', v_nt, 'normal_best_level', v_nl,
    'item_rank', v_ir, 'item_total', v_it, 'item_best_level', v_il
  );
end $$;

revoke execute on function game_player_rank(text) from public, anon, authenticated;
grant  execute on function game_player_rank(text) to service_role;
