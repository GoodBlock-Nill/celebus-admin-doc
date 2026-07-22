-- ─────────────────────────────────────────────────────────────
-- V01D POP (game-app) — 점수 / 랭킹 스키마  [2단계]
-- 공유 Supabase 프로젝트(contest/feedback와 동일)에 game_ 프리픽스로 격리.
-- 실행: Supabase SQL Editor에 통째로 붙여넣기 (idempotent — 재실행 안전).
-- ─────────────────────────────────────────────────────────────

-- 점수 기록 (한 판 = 한 행). 최고점은 뷰/RPC가 플레이어별로 집계.
create table if not exists game_scores (
  id          uuid primary key default gen_random_uuid(),
  player_hash text not null,                         -- 서명 쿠키 anonId의 game 스코프 해시 (원본 미저장)
  nickname    text not null default '익명',
  mode        text not null check (mode in ('daily', 'free')),
  seed        bigint,                                 -- 보드 시드 (daily = 그날 시드, free = 랜덤)
  score       int  not null check (score >= 0 and score <= 1000000),
  created_at  timestamptz not null default now()
);

alter table game_scores enable row level security;  -- 직접 접근 차단 (뷰/RPC 경유만)

create index if not exists game_scores_daily_idx  on game_scores (mode, created_at desc, score desc);
create index if not exists game_scores_player_idx on game_scores (player_hash, created_at desc);

-- 오늘의 일일 시드 (KST 날짜 → YYYYMMDD). 클라이언트 dailySeed()와 동일 규칙 → 위조 방지에 사용.
create or replace function game_daily_seed()
returns bigint language sql stable as $$
  select to_char((now() at time zone 'Asia/Seoul')::date, 'YYYYMMDD')::bigint;
$$;

-- ── 리더보드 뷰 (닉네임+점수만 노출, player_hash 비노출 → anon 읽기 안전) ──

-- 일일: 오늘(KST) daily 판, 플레이어별 최고점, 상위 100
create or replace view game_daily_leaderboard as
select row_number() over (order by best desc, first_at asc) as rank, nickname, best as score
from (
  select player_hash,
         max(score) as best,
         min(created_at) as first_at,
         (array_agg(nickname order by created_at desc))[1] as nickname
  from game_scores
  where mode = 'daily'
    and (created_at at time zone 'Asia/Seoul')::date = (now() at time zone 'Asia/Seoul')::date
  group by player_hash
) t
order by best desc, first_at asc
limit 100;

-- 주간: 최근 7일(모드 무관), 플레이어별 최고점, 상위 100
create or replace view game_weekly_leaderboard as
select row_number() over (order by best desc, first_at asc) as rank, nickname, best as score
from (
  select player_hash,
         max(score) as best,
         min(created_at) as first_at,
         (array_agg(nickname order by created_at desc))[1] as nickname
  from game_scores
  where created_at >= now() - interval '7 days'
  group by player_hash
) t
order by best desc, first_at asc
limit 100;

grant select on game_daily_leaderboard, game_weekly_leaderboard to anon, authenticated;

-- ── 점수 제출 (검증 + 기록 + 랭크 반환) — service_role 전용 ──
create or replace function game_submit_score(
  p_player_hash text, p_nickname text, p_mode text, p_seed bigint, p_score int
) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_nick   text := left(coalesce(nullif(trim(p_nickname), ''), '익명'), 16);
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

  insert into game_scores (player_hash, nickname, mode, seed, score)
  values (p_player_hash, v_nick, p_mode, p_seed, p_score);

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

revoke execute on function game_submit_score(text, text, text, bigint, int) from public, anon, authenticated;
grant  execute on function game_submit_score(text, text, text, bigint, int) to service_role;

-- ── 내 랭크 조회 (리더보드 화면에서 본인 위치 표시) — service_role 전용 ──
create or replace function game_player_rank(p_player_hash text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_dbest int; v_drank int; v_dtotal int;
  v_wbest int; v_wrank int; v_wtotal int;
begin
  with today as (
    select player_hash, max(score) as best from game_scores
    where mode = 'daily'
      and (created_at at time zone 'Asia/Seoul')::date = (now() at time zone 'Asia/Seoul')::date
    group by player_hash
  ), me as (select best from today where player_hash = p_player_hash)
  select (select best from me),
         (select count(*) from today where best > (select best from me)) + 1,
         (select count(*) from today)
  into v_dbest, v_drank, v_dtotal;

  with wk as (
    select player_hash, max(score) as best from game_scores
    where created_at >= now() - interval '7 days' group by player_hash
  ), me as (select best from wk where player_hash = p_player_hash)
  select (select best from me),
         (select count(*) from wk where best > (select best from me)) + 1,
         (select count(*) from wk)
  into v_wbest, v_wrank, v_wtotal;

  return jsonb_build_object(
    'daily_best',  v_dbest,
    'daily_rank',  case when v_dbest is null then null else v_drank end,
    'daily_total', v_dtotal,
    'weekly_best',  v_wbest,
    'weekly_rank',  case when v_wbest is null then null else v_wrank end,
    'weekly_total', v_wtotal
  );
end $$;

revoke execute on function game_player_rank(text) from public, anon, authenticated;
grant  execute on function game_player_rank(text) to service_role;
