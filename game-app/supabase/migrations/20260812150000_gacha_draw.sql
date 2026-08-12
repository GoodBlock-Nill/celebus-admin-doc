-- ─────────────────────────────────────────────────────────────
-- 038: 가챠 이벤트·풀·뽑기 (Phase 3 — docs/weekly-rank-prize-reward-plan.md §3·§8·§9)
--   kind='digital'(재화 확률형, 상시) / 'physical_box'(실물 재고 소진형 — Phase 4에서 뽑기 허용).
--   Phase 3 뽑기 RPC는 digital만: 가중치 추첨, 꽝 없음, 무상 이용권 우선 차감, 10연 보너스 1장.
--   유상 이용권은 digital 전용(사행성 분리) — physical_box 뽑기는 Phase 4에서 무상 잔액만 허용.
-- ─────────────────────────────────────────────────────────────

create table if not exists game_gacha_event (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('physical_box', 'digital')),
  status      text not null default 'draft'
              check (status in ('draft', 'published', 'ended', 'canceled')),
  title       jsonb not null default '{}'::jsonb,   -- {ko,en,ja}
  description jsonb not null default '{}'::jsonb,
  image_url   text,
  starts_at   timestamptz,                          -- null = 즉시 (digital 상시)
  ends_at     timestamptz,                          -- null = 무기한
  claim_days  int not null default 7 check (claim_days between 1 and 30), -- 실물 수령 기한 (Phase 4)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table game_gacha_event enable row level security;

create table if not exists game_gacha_pool_item (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references game_gacha_event(id) on delete cascade,
  grade            text not null check (grade in ('S', 'A', 'B', 'C', 'D')),
  prize            jsonb not null default '{}'::jsonb,  -- {ko,en,ja} 아이템명
  image_url        text,
  is_physical      boolean not null default false,
  requires_address boolean not null default false,
  reward_payload   jsonb,                               -- 재화형: {"cp":100} | {"item":"heart","qty":1}
  total_qty        int,                                 -- 박스형 전용
  remaining_qty    int check (remaining_qty >= 0),      -- 박스형 전용, 뽑기마다 차감
  weight           int check (weight > 0),              -- 확률형 전용 (가중치, null = 아카이브 — 추첨·공시 제외)
  per_user_cap     int check (per_user_cap >= 1),       -- 1인 당첨 상한 (null=무제한)
  sort             int not null default 0
);
create index if not exists idx_gacha_pool_event on game_gacha_pool_item (event_id, sort);
alter table game_gacha_pool_item enable row level security;

create table if not exists game_gacha_draw (
  id           uuid primary key default gen_random_uuid(),
  player_hash  text not null,
  event_id     uuid not null references game_gacha_event(id),
  pool_item_id uuid not null references game_gacha_pool_item(id),
  used_paid    boolean not null default false,  -- physical_box에서는 항상 false (Phase 4에서 강제)
  created_at   timestamptz not null default now()
);
create index if not exists idx_gacha_draw_player on game_gacha_draw (player_hash, created_at desc);
create index if not exists idx_gacha_draw_event on game_gacha_draw (event_id, pool_item_id);
alter table game_gacha_draw enable row level security;

-- 공개 뷰 — 게시 중 이벤트 + 풀 공시(재화형=가중치, 박스형=잔여/전체). 개인·운영 필드 제외 (game_notice_public 패턴)
-- 재화형에서 weight가 비워진 아이템 = 아카이브(추첨·공시 제외 — 뽑기 이력 FK 때문에 행 삭제 대신 사용)
create or replace view game_gacha_event_public as
  select e.id, e.kind, e.title, e.description, e.image_url, e.starts_at, e.ends_at,
         (select coalesce(jsonb_agg(jsonb_build_object(
             'grade', p.grade, 'prize', p.prize, 'image_url', p.image_url, 'is_physical', p.is_physical,
             'weight', p.weight, 'total_qty', p.total_qty, 'remaining_qty', p.remaining_qty,
             'reward_payload', p.reward_payload, 'sort', p.sort)
             order by p.sort asc, p.grade asc), '[]'::jsonb)
          from game_gacha_pool_item p
          where p.event_id = e.id and (e.kind <> 'digital' or p.weight > 0)) as pool
  from game_gacha_event e
  where e.status = 'published'
    and (e.starts_at is null or e.starts_at <= now())
    and (e.ends_at   is null or e.ends_at   >  now());
grant select on game_gacha_event_public to anon, authenticated;

-- ── 뽑기 실행 (Phase 3: digital 전용) — 이용권 차감 + 가중치 추첨 + 보상 지급 + 원장, 단일 트랜잭션 ──
create or replace function game_gacha_draw_exec(p_player_hash text, p_event_id uuid, p_count int)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_ev record;
  v_free int; v_paid int;
  v_use_free int; v_use_paid int;
  v_total_w bigint; v_pick bigint;
  r record;
  v_cp_sum int := 0;
  v_results jsonb := '[]'::jsonb;
  v_draw_id uuid;
  v_bonus_paid boolean;
  v_point int; v_item text; v_qty int;
begin
  if p_count is null or p_count not in (1, 10) then return jsonb_build_object('error', 'bad_count'); end if;

  select * into v_ev from game_gacha_event where id = p_event_id;
  if not found or v_ev.status <> 'published'
     or (v_ev.starts_at is not null and v_ev.starts_at > now())
     or (v_ev.ends_at   is not null and v_ev.ends_at   <= now()) then
    return jsonb_build_object('error', 'bad_event');
  end if;
  if v_ev.kind <> 'digital' then return jsonb_build_object('error', 'not_supported'); end if; -- 실물 박스는 Phase 4

  -- 이용권 지갑 잠금 + 무상 우선 차감
  insert into game_gacha_wallet (player_hash) values (p_player_hash) on conflict do nothing;
  select free_tickets, paid_tickets into v_free, v_paid
  from game_gacha_wallet where player_hash = p_player_hash for update;
  if v_free + v_paid < p_count then return jsonb_build_object('error', 'insufficient_tickets'); end if;
  v_use_free := least(v_free, p_count);
  v_use_paid := p_count - v_use_free;

  select coalesce(sum(weight), 0) into v_total_w
  from game_gacha_pool_item where event_id = p_event_id and weight > 0;
  if v_total_w <= 0 then return jsonb_build_object('error', 'empty_pool'); end if;

  for i in 1..p_count loop
    -- 가중치 추첨 (서버 단독 난수 — 클라이언트 개입 불가)
    v_pick := floor(random() * v_total_w)::bigint;
    select p.* into r
    from (
      select *, sum(weight) over (order by sort asc, id asc) as cum
      from game_gacha_pool_item where event_id = p_event_id and weight > 0
    ) p
    where p.cum > v_pick
    order by p.cum asc
    limit 1;

    insert into game_gacha_draw (player_hash, event_id, pool_item_id, used_paid)
    values (p_player_hash, p_event_id, r.id, i > v_use_free)
    returning id into v_draw_id;

    -- 재화 지급 (꽝 없음 — CP는 합산 후 일괄, 아이템은 즉시)
    if r.reward_payload ? 'cp' then
      v_cp_sum := v_cp_sum + (r.reward_payload ->> 'cp')::int;
    elsif r.reward_payload ? 'item' then
      v_item := r.reward_payload ->> 'item';
      v_qty := coalesce((r.reward_payload ->> 'qty')::int, 1);
      insert into game_inventory (player_hash, item_type, qty)
      values (p_player_hash, v_item, v_qty)
      on conflict (player_hash, item_type) do update set qty = game_inventory.qty + excluded.qty;
    end if;

    v_results := v_results || jsonb_build_object(
      'draw_id', v_draw_id, 'grade', r.grade, 'prize', r.prize, 'image_url', r.image_url,
      'reward', r.reward_payload);
  end loop;

  -- 이용권 차감 + 원장
  update game_gacha_wallet
  set free_tickets = free_tickets - v_use_free, paid_tickets = paid_tickets - v_use_paid, updated_at = now()
  where player_hash = p_player_hash;
  insert into game_gacha_ticket_ledger (player_hash, delta_free, delta_paid, reason)
  values (p_player_hash, -v_use_free, -v_use_paid, 'draw:' || p_event_id || ':x' || p_count);

  -- 10연 보너스 이용권 1장 — 유형은 소모분 승계 (유상 포함 시 유상: 유상→무상 전환 차단 = 사행성 분리 유지)
  if p_count = 10 then
    v_bonus_paid := v_use_paid > 0;
    update game_gacha_wallet
    set free_tickets = free_tickets + case when v_bonus_paid then 0 else 1 end,
        paid_tickets = paid_tickets + case when v_bonus_paid then 1 else 0 end,
        updated_at = now()
    where player_hash = p_player_hash;
    insert into game_gacha_ticket_ledger (player_hash, delta_free, delta_paid, reason)
    values (p_player_hash, case when v_bonus_paid then 0 else 1 end, case when v_bonus_paid then 1 else 0 end,
            'bonus:' || p_event_id);
  end if;

  -- CP 일괄 지급 + 포인트 원장
  if v_cp_sum > 0 then
    insert into game_wallet (player_hash, celeb_point) values (p_player_hash, v_cp_sum)
    on conflict (player_hash) do update
      set celeb_point = game_wallet.celeb_point + excluded.celeb_point, updated_at = now();
    insert into game_point_ledger (player_hash, delta, reason)
    values (p_player_hash, v_cp_sum, 'gacha:' || p_event_id || ':x' || p_count);
  end if;

  select celeb_point into v_point from game_wallet where player_hash = p_player_hash;
  select free_tickets, paid_tickets into v_free, v_paid from game_gacha_wallet where player_hash = p_player_hash;
  return jsonb_build_object(
    'results', v_results, 'bonus_ticket', (p_count = 10),
    'celeb_point', coalesce(v_point, 0), 'free_tickets', v_free, 'paid_tickets', v_paid);
end $$;
revoke execute on function game_gacha_draw_exec(text, uuid, int) from public, anon, authenticated;
grant  execute on function game_gacha_draw_exec(text, uuid, int) to service_role;

notify pgrst, 'reload schema';
