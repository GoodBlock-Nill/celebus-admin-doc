-- ─────────────────────────────────────────────────────────────
-- V01D POP (game-app) — 랭킹 아바타 추가  [프로필]
-- 001_game_schema.sql 이후 실행. Supabase SQL Editor에 통째로 붙여넣기 (재실행 안전).
-- avatar 컬럼 하나로 지금은 아바타 id, 나중엔 소셜 프사 URL 모두 수용.
-- ─────────────────────────────────────────────────────────────

alter table game_scores add column if not exists avatar text;

-- ── 리더보드 뷰 재생성 (avatar 추가 — 플레이어별 최신값) ──

-- ※ create or replace view는 기존 컬럼 순서 변경 불가 → avatar는 맨 뒤에 추가(클라는 컬럼명으로 조회, 순서 무관)
create or replace view game_daily_leaderboard as
select row_number() over (order by best desc, first_at asc) as rank, nickname, best as score, avatar
from (
  select player_hash,
         max(score) as best,
         min(created_at) as first_at,
         (array_agg(nickname order by created_at desc))[1] as nickname,
         (array_agg(avatar   order by created_at desc))[1] as avatar
  from game_scores
  where mode = 'daily'
    and (created_at at time zone 'Asia/Seoul')::date = (now() at time zone 'Asia/Seoul')::date
  group by player_hash
) t
order by best desc, first_at asc
limit 100;

create or replace view game_weekly_leaderboard as
select row_number() over (order by best desc, first_at asc) as rank, nickname, best as score, avatar
from (
  select player_hash,
         max(score) as best,
         min(created_at) as first_at,
         (array_agg(nickname order by created_at desc))[1] as nickname,
         (array_agg(avatar   order by created_at desc))[1] as avatar
  from game_scores
  where created_at >= now() - interval '7 days'
  group by player_hash
) t
order by best desc, first_at asc
limit 100;

grant select on game_daily_leaderboard, game_weekly_leaderboard to anon, authenticated;

-- ── 점수 제출 RPC — p_avatar 추가 (시그니처 변경 → 옛 5-인자 함수 제거 후 재생성) ──
drop function if exists game_submit_score(text, text, text, bigint, int);

create or replace function game_submit_score(
  p_player_hash text, p_nickname text, p_avatar text, p_mode text, p_seed bigint, p_score int
) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_nick   text := left(coalesce(nullif(trim(p_nickname), ''), '익명'), 16);
  v_av     text := left(nullif(trim(p_avatar), ''), 200);
  v_best   int;
  v_drank  int; v_dtotal int;
  v_wrank  int; v_wtotal int;
begin
  if p_mode not in ('daily', 'free') then return jsonb_build_object('error', 'bad_mode'); end if;
  if p_score < 0 or p_score > 1000000 then return jsonb_build_object('error', 'bad_score'); end if;
  -- 일일은 오늘 시드만 인정 (지난 판/조작 시드 배제)
  if p_mode = 'daily' and p_seed is distinct from game_daily_seed() then
    return jsonb_build_object('error', 'stale_seed');
  end if;

  insert into game_scores (player_hash, nickname, avatar, mode, seed, score)
  values (p_player_hash, v_nick, v_av, p_mode, p_seed, p_score);

  -- 일일 랭크 (오늘, 플레이어별 최고 기준)
  with today as (
    select player_hash, max(score) as best
    from game_scores
    where mode = 'daily'
      and (created_at at time zone 'Asia/Seoul')::date = (now() at time zone 'Asia/Seoul')::date
    group by player_hash
  ), me as (select best from today where player_hash = p_player_hash)
  select (select count(*) from today where best > (select best from me)) + 1,
         (select count(*) from today)
  into v_drank, v_dtotal;

  -- 주간 랭크 (최근 7일)
  with wk as (
    select player_hash, max(score) as best
    from game_scores where created_at >= now() - interval '7 days'
    group by player_hash
  ), me as (select best from wk where player_hash = p_player_hash)
  select (select count(*) from wk where best > (select best from me)) + 1,
         (select count(*) from wk)
  into v_wrank, v_wtotal;

  select max(score) into v_best from game_scores where player_hash = p_player_hash;

  return jsonb_build_object(
    'best', v_best,
    'daily_rank', v_drank, 'daily_total', v_dtotal,
    'weekly_rank', v_wrank, 'weekly_total', v_wtotal
  );
end $$;

revoke execute on function game_submit_score(text, text, text, text, bigint, int) from public, anon, authenticated;
grant  execute on function game_submit_score(text, text, text, text, bigint, int) to service_role;
