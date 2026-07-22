-- ─────────────────────────────────────────────────────────────
-- V01D POP (game-app) — 데일리 출석 보상·스트릭 + 포인트 원장  [W3a]
-- 001~004 이후 실행. Supabase SQL Editor에 통째로 붙여넣기 (재실행 안전).
-- 서버 권위: 보상은 서버에서 계산·지급, 원장에 기록.
-- ⚠️ 데일리 보상 파라미터(base/step/maxDays)는 여기 하드코딩 — GAME_CONFIG.daily와 동기 유지(W3b에서 DB화).
-- ─────────────────────────────────────────────────────────────

-- 출석 상태 (연속 스트릭)
create table if not exists game_daily_claim (
  player_hash     text primary key,
  streak          int not null default 0,
  last_claim_date date,
  updated_at      timestamptz not null default now()
);

-- CELEB Point 원장 (모든 증감 감사)
create table if not exists game_point_ledger (
  id          uuid primary key default gen_random_uuid(),
  player_hash text not null,
  delta       int not null,
  reason      text not null,
  created_at  timestamptz not null default now()
);
create index if not exists game_point_ledger_player_idx on game_point_ledger (player_hash, created_at desc);

alter table game_daily_claim  enable row level security;  -- 직접 접근 차단 (RPC 경유만)
alter table game_point_ledger enable row level security;

-- 상점 가격 표시 권위 소스 — 카탈로그 public 뷰(RLS 우회, 리더보드 뷰와 동일 패턴). 가격 드리프트 해소.
create or replace view game_catalog_public as
select item_type, price, sort from game_item_catalog;
grant select on game_catalog_public to anon, authenticated;

-- ── 데일리 출석 보상 수령 — service_role 전용 ──
create or replace function game_claim_daily(p_player_hash text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_today  date := (now() at time zone 'Asia/Seoul')::date;
  v_last   date; v_streak int; v_reward int; v_point int;
  v_base int := 50; v_step int := 10; v_max int := 7;   -- GAME_CONFIG.daily와 동기
begin
  select last_claim_date, streak into v_last, v_streak from game_daily_claim where player_hash = p_player_hash;
  if v_last = v_today then
    return jsonb_build_object('claimed', false, 'streak', coalesce(v_streak, 0));
  end if;
  -- 연속(어제 수령) 이면 +1, 아니면 리셋
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

-- ── 데일리 상태 (수령 가능 여부·스트릭·다음 보상) — service_role 전용 ──
create or replace function game_daily_status(p_player_hash text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_last date; v_streak int; v_next_streak int; v_next int;
  v_base int := 50; v_step int := 10; v_max int := 7;
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

-- ── 충전 RPC 재작성 (원장 기록 추가, 시그니처 불변) ──
create or replace function game_charge_point(p_player_hash text, p_amount int)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_point int;
begin
  if p_amount <= 0 or p_amount > 100000 then return jsonb_build_object('error', 'bad_amount'); end if;
  insert into game_wallet (player_hash, celeb_point, updated_at)
  values (p_player_hash, p_amount, now())
  on conflict (player_hash) do update
    set celeb_point = game_wallet.celeb_point + excluded.celeb_point, updated_at = now()
  returning celeb_point into v_point;
  insert into game_point_ledger (player_hash, delta, reason) values (p_player_hash, p_amount, 'charge');
  return jsonb_build_object('celeb_point', v_point);
end $$;

revoke execute on function game_charge_point(text, int) from public, anon, authenticated;
grant  execute on function game_charge_point(text, int) to service_role;

-- ── 구매 RPC 재작성 (원장 기록 추가, 시그니처 불변) ──
create or replace function game_buy_item(p_player_hash text, p_item_type text, p_qty int)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_price int; v_cost int; v_point int; v_inv jsonb;
begin
  if p_qty <= 0 or p_qty > 99 then return jsonb_build_object('error', 'bad_qty'); end if;
  select price into v_price from game_item_catalog where item_type = p_item_type;
  if v_price is null then return jsonb_build_object('error', 'bad_item'); end if;
  v_cost := v_price * p_qty;

  update game_wallet set celeb_point = celeb_point - v_cost, updated_at = now()
  where player_hash = p_player_hash and celeb_point >= v_cost
  returning celeb_point into v_point;
  if not found then return jsonb_build_object('error', 'insufficient'); end if;

  insert into game_inventory (player_hash, item_type, qty)
  values (p_player_hash, p_item_type, p_qty)
  on conflict (player_hash, item_type) do update set qty = game_inventory.qty + excluded.qty;

  insert into game_point_ledger (player_hash, delta, reason) values (p_player_hash, -v_cost, 'buy:' || p_item_type);

  select coalesce(jsonb_object_agg(item_type, qty), '{}'::jsonb) into v_inv
  from game_inventory where player_hash = p_player_hash and qty > 0;
  return jsonb_build_object('celeb_point', v_point, 'inventory', v_inv);
end $$;

revoke execute on function game_buy_item(text, text, int) from public, anon, authenticated;
grant  execute on function game_buy_item(text, text, int) to service_role;
