-- ─────────────────────────────────────────────────────────────
-- V01D POP (game-app) — GAME_CONFIG DB화 (관리자 실시간 튜닝)  [W3b-1]
-- 001~005 이후 실행. Supabase SQL Editor에 통째로 붙여넣기 (재실행 안전).
-- 단일 행 jsonb 오버라이드. 클라는 부트 시 병합, 서버는 데일리 파라미터를 여기서 읽음.
-- ─────────────────────────────────────────────────────────────

create table if not exists game_config (
  id         int primary key default 1 check (id = 1),
  config     jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table game_config enable row level security;  -- 직접 접근 차단(뷰/RPC 경유)

-- 단일 행 시드(오버라이드 없음 = 코드 기본값)
insert into game_config (id, config) values (1, '{}'::jsonb) on conflict (id) do nothing;

-- public 뷰 — 클라 부트 병합용 anon 읽기(리더보드·카탈로그 뷰와 동일 패턴)
create or replace view game_config_public as select config from game_config where id = 1;
grant select on game_config_public to anon, authenticated;

-- ── 데일리 파라미터를 game_config에서 읽도록 RPC 재작성(하드코딩 제거, 폴백 50/10/7) ──
create or replace function game_claim_daily(p_player_hash text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_today  date := (now() at time zone 'Asia/Seoul')::date;
  v_last   date; v_streak int; v_reward int; v_point int;
  v_cfg  jsonb := coalesce((select config -> 'daily' from game_config where id = 1), '{}'::jsonb);
  v_base int := coalesce((v_cfg ->> 'base')::int, 50);
  v_step int := coalesce((v_cfg ->> 'streakStep')::int, 10);
  v_max  int := coalesce((v_cfg ->> 'maxStreakDays')::int, 7);
begin
  select last_claim_date, streak into v_last, v_streak from game_daily_claim where player_hash = p_player_hash;
  if v_last = v_today then
    return jsonb_build_object('claimed', false, 'streak', coalesce(v_streak, 0));
  end if;
  v_streak := case when v_last = v_today - 1 then coalesce(v_streak, 0) + 1 else 1 end;
  v_reward := v_base + v_step * (least(v_streak, v_max) - 1);

  insert into game_wallet (player_hash, celeb_point, updated_at)
  values (p_player_hash, v_reward, now())
  on conflict (player_hash) do update
    set celeb_point = game_wallet.celeb_point + excluded.celeb_point, updated_at = now()
  returning celeb_point into v_point;

  insert into game_daily_claim (player_hash, streak, last_claim_date, updated_at)
  values (p_player_hash, v_streak, v_today, now())
  on conflict (player_hash) do update
    set streak = excluded.streak, last_claim_date = excluded.last_claim_date, updated_at = now();

  insert into game_point_ledger (player_hash, delta, reason) values (p_player_hash, v_reward, 'daily');

  return jsonb_build_object('claimed', true, 'reward', v_reward, 'streak', v_streak, 'celeb_point', v_point);
end $$;

revoke execute on function game_claim_daily(text) from public, anon, authenticated;
grant  execute on function game_claim_daily(text) to service_role;

create or replace function game_daily_status(p_player_hash text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_last date; v_streak int; v_next_streak int; v_next int;
  v_cfg  jsonb := coalesce((select config -> 'daily' from game_config where id = 1), '{}'::jsonb);
  v_base int := coalesce((v_cfg ->> 'base')::int, 50);
  v_step int := coalesce((v_cfg ->> 'streakStep')::int, 10);
  v_max  int := coalesce((v_cfg ->> 'maxStreakDays')::int, 7);
begin
  select last_claim_date, streak into v_last, v_streak from game_daily_claim where player_hash = p_player_hash;
  v_streak := coalesce(v_streak, 0);
  if v_last = v_today then
    return jsonb_build_object('claimable', false, 'streak', v_streak, 'next_reward', null);
  end if;
  v_next_streak := case when v_last = v_today - 1 then v_streak + 1 else 1 end;
  v_next := v_base + v_step * (least(v_next_streak, v_max) - 1);
  return jsonb_build_object('claimable', true, 'streak', v_streak, 'next_reward', v_next);
end $$;

revoke execute on function game_daily_status(text) from public, anon, authenticated;
grant  execute on function game_daily_status(text) to service_role;
