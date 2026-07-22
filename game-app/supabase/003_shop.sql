-- ─────────────────────────────────────────────────────────────
-- V01D POP (game-app) — 아이템 상점 / CELEB Point 경제  [상점]
-- 002_avatar.sql 이후 실행. Supabase SQL Editor에 통째로 붙여넣기 (재실행 안전).
-- 서버 권위 지갑·인벤토리: 구매·충전·소비는 RPC가 원자적으로 검증(클라이언트 값 불신).
-- ─────────────────────────────────────────────────────────────

-- 방어: 002를 먼저 실행하지 않았어도 주간뷰 재생성이 실패하지 않도록 avatar 컬럼 보장.
--  ※ 단, 아바타 기능 전체(일일 리더보드 뷰·점수제출 RPC 아바타 반영)는 002 실행이 필수.
alter table game_scores add column if not exists avatar text;

-- 지갑 (CELEB Point 잔액) — player_hash 귀속(익명 쿠키 신원)
create table if not exists game_wallet (
  player_hash text primary key,
  celeb_point int not null default 0 check (celeb_point >= 0),
  updated_at  timestamptz not null default now()
);

-- 인벤토리 (보유 아이템 개수)
create table if not exists game_inventory (
  player_hash text not null,
  item_type   text not null,
  qty         int  not null default 0 check (qty >= 0),
  primary key (player_hash, item_type)
);

-- 아이템 카탈로그 (가격) — 관리자화 대상(가격 조정 지점)
create table if not exists game_item_catalog (
  item_type text primary key,
  price     int  not null check (price >= 0),
  sort      int  not null default 0
);

alter table game_wallet       enable row level security;  -- 직접 접근 차단 (RPC 경유만)
alter table game_inventory    enable row level security;
alter table game_item_catalog enable row level security;

-- 카탈로그 시드 (파일럿 가격)
insert into game_item_catalog (item_type, price, sort) values
  ('bomb', 100, 1), ('line', 100, 2), ('shuffle', 60, 3), ('time', 80, 4)
on conflict (item_type) do nothing;

-- ── 계정 조회 (잔액 + 인벤토리) — service_role 전용 ──
create or replace function game_get_account(p_player_hash text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_point int; v_inv jsonb;
begin
  select celeb_point into v_point from game_wallet where player_hash = p_player_hash;
  select coalesce(jsonb_object_agg(item_type, qty), '{}'::jsonb) into v_inv
  from game_inventory where player_hash = p_player_hash and qty > 0;
  return jsonb_build_object('celeb_point', coalesce(v_point, 0), 'inventory', coalesce(v_inv, '{}'::jsonb));
end $$;

revoke execute on function game_get_account(text) from public, anon, authenticated;
grant  execute on function game_get_account(text) to service_role;

-- ── 충전 (파일럿 테스트 충전) — service_role 전용 ──
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
  return jsonb_build_object('celeb_point', v_point);
end $$;

revoke execute on function game_charge_point(text, int) from public, anon, authenticated;
grant  execute on function game_charge_point(text, int) to service_role;

-- ── 아이템 구매 (가격 조회 → 잔액 확인 → 차감 + 인벤토리 증가, 원자적) — service_role 전용 ──
create or replace function game_buy_item(p_player_hash text, p_item_type text, p_qty int)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_price int; v_cost int; v_point int; v_inv jsonb;
begin
  if p_qty <= 0 or p_qty > 99 then return jsonb_build_object('error', 'bad_qty'); end if;
  select price into v_price from game_item_catalog where item_type = p_item_type;
  if v_price is null then return jsonb_build_object('error', 'bad_item'); end if;
  v_cost := v_price * p_qty;

  -- 잔액 확인 + 차감 (원자적 — 부족하면 update 0행)
  update game_wallet set celeb_point = celeb_point - v_cost, updated_at = now()
  where player_hash = p_player_hash and celeb_point >= v_cost
  returning celeb_point into v_point;
  if not found then return jsonb_build_object('error', 'insufficient'); end if;

  -- 인벤토리 증가
  insert into game_inventory (player_hash, item_type, qty)
  values (p_player_hash, p_item_type, p_qty)
  on conflict (player_hash, item_type) do update set qty = game_inventory.qty + excluded.qty;

  select coalesce(jsonb_object_agg(item_type, qty), '{}'::jsonb) into v_inv
  from game_inventory where player_hash = p_player_hash and qty > 0;
  return jsonb_build_object('celeb_point', v_point, 'inventory', v_inv);
end $$;

revoke execute on function game_buy_item(text, text, int) from public, anon, authenticated;
grant  execute on function game_buy_item(text, text, int) to service_role;

-- ── 아이템 소비 (자유 플레이 종료 시 사용분 차감, 보유량으로 clamp) — service_role 전용 ──
create or replace function game_consume_items(p_player_hash text, p_used jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare k text; v int; v_inv jsonb;
begin
  for k, v in select key, greatest(0, (value)::int) from jsonb_each_text(coalesce(p_used, '{}'::jsonb)) loop
    if v > 0 then
      update game_inventory set qty = greatest(0, qty - v)
      where player_hash = p_player_hash and item_type = k;
    end if;
  end loop;
  select coalesce(jsonb_object_agg(item_type, qty), '{}'::jsonb) into v_inv
  from game_inventory where player_hash = p_player_hash and qty > 0;
  return jsonb_build_object('inventory', coalesce(v_inv, '{}'::jsonb));
end $$;

revoke execute on function game_consume_items(text, jsonb) from public, anon, authenticated;
grant  execute on function game_consume_items(text, jsonb) to service_role;

-- ── 주간 리더보드 = 일일 모드만(자유 플레이 랭킹 제외 → 공정성) ──
-- ※ avatar는 맨 뒤 컬럼(create or replace view 순서 제약 회피)
create or replace view game_weekly_leaderboard as
select row_number() over (order by best desc, first_at asc) as rank, nickname, best as score, avatar
from (
  select player_hash,
         max(score) as best,
         min(created_at) as first_at,
         (array_agg(nickname order by created_at desc))[1] as nickname,
         (array_agg(avatar   order by created_at desc))[1] as avatar
  from game_scores
  where mode = 'daily' and created_at >= now() - interval '7 days'
  group by player_hash
) t
order by best desc, first_at asc
limit 100;

grant select on game_weekly_leaderboard to anon, authenticated;
