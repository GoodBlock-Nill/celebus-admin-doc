-- ─────────────────────────────────────────────────────────────
-- 037: 주간 랭킹 가챠 이용권 경제 (Phase 2 — docs/weekly-rank-prize-reward-plan.md §2·§8)
--   무상(주간 랭킹 보상) / 유상(CP 구매) 이용권 분리 지갑 + 전체 원장 + 주간 지급 중복 차단.
--   유상 이용권은 재화 가챠 전용(사행성 분리) — 실물 가챠 뽑기 RPC(Phase 4)에서 무상 잔액만 차감 강제.
--   지급표는 game_config rewards.weeklyTickets (관리자 전용 폼, Phase 1) — 수령 시점에 읽음(소급 특성은 CP 보상표와 동일).
-- ─────────────────────────────────────────────────────────────

-- 이용권 지갑 — 무상/유상 분리 보관 (사행성 분리의 시스템 강제 지점)
create table if not exists game_gacha_wallet (
  player_hash  text primary key,
  free_tickets int not null default 0 check (free_tickets >= 0),
  paid_tickets int not null default 0 check (paid_tickets >= 0),
  updated_at   timestamptz not null default now()
);
alter table game_gacha_wallet enable row level security; -- 정책 없음 = service_role 전용

-- 이용권 원장 — 지급·구매·사용·회수 전체 기록 (경제 모니터링·부정 회수 근거)
create table if not exists game_gacha_ticket_ledger (
  id          bigint generated always as identity primary key,
  player_hash text not null,
  delta_free  int not null default 0,
  delta_paid  int not null default 0,
  reason      text not null, -- weekly:{주}:{모드}:rank{n} | buy:{n} | draw:{id} | admin:{사유}
  created_at  timestamptz not null default now()
);
create index if not exists idx_gacha_ticket_ledger_player on game_gacha_ticket_ledger (player_hash, created_at desc);
alter table game_gacha_ticket_ledger enable row level security;

-- 주간 지급 기록 — PK가 중복 지급 차단 (game_week_rewards 패턴)
create table if not exists game_week_tickets (
  player_hash text not null,
  week_start  date not null,
  mode        text not null,
  rank        int  not null,
  tickets     int  not null,
  created_at  timestamptz not null default now(),
  primary key (player_hash, week_start, mode)
);
alter table game_week_tickets enable row level security;

-- ── 주간 이용권 lazy claim — game_claim_week_reward와 동일 골격 (지난주 KST, flagged 제외, 모드별 각각) ──
create or replace function game_claim_week_tickets(p_player_hash text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_week_start date := (date_trunc('week', now() at time zone 'Asia/Seoul'))::date - 7;
  v_from timestamptz := (v_week_start::timestamp) at time zone 'Asia/Seoul';
  v_to   timestamptz := ((v_week_start + 7)::timestamp) at time zone 'Asia/Seoul';
  v_conf jsonb := coalesce(
    (select config -> 'rewards' -> 'weeklyTickets' from game_config where id = 1),
    '{"tiers":[{"from":1,"to":1,"tickets":10},{"from":2,"to":5,"tickets":5},{"from":6,"to":10,"tickets":3}],"others":1}'::jsonb);
  r record;
  v_n int; v_paid boolean; v_total int := 0;
  v_out jsonb := '{}'::jsonb;
  v_free int; v_paid_bal int;
begin
  for r in
    with best as (
      select distinct on (player_hash, mode) player_hash, mode, level, score, created_at
      from game_scores
      where created_at >= v_from and created_at < v_to and not flagged
      order by player_hash, mode, level desc, score desc, created_at asc
    )
    select m.mode,
           (select count(*) + 1 from best b
             where b.mode = m.mode
               and (b.level, b.score, -extract(epoch from b.created_at)) > (m.level, m.score, -extract(epoch from m.created_at))) as rank
    from best m
    where m.player_hash = p_player_hash
  loop
    -- 구간 매칭 → 없으면 others (그 외 기록 보유자 전원)
    select coalesce(
      (select (t ->> 'tickets')::int
       from jsonb_array_elements(v_conf -> 'tiers') t
       where (t ->> 'from')::int <= r.rank and r.rank <= (t ->> 'to')::int
       limit 1),
      coalesce((v_conf ->> 'others')::int, 0))
    into v_n;

    v_paid := false;
    if v_n > 0 then
      begin
        insert into game_week_tickets (player_hash, week_start, mode, rank, tickets)
        values (p_player_hash, v_week_start, r.mode, r.rank::int, v_n);
        v_paid := true;
      exception when unique_violation then
        v_paid := false; v_n := 0;
      end;
      if v_paid then
        insert into game_gacha_wallet (player_hash, free_tickets)
        values (p_player_hash, v_n)
        on conflict (player_hash) do update
          set free_tickets = game_gacha_wallet.free_tickets + excluded.free_tickets, updated_at = now();
        insert into game_gacha_ticket_ledger (player_hash, delta_free, reason)
        values (p_player_hash, v_n, 'weekly:' || v_week_start || ':' || r.mode || ':rank' || r.rank);
        v_total := v_total + v_n;
      end if;
    end if;
    v_out := v_out || jsonb_build_object(
      case when r.mode = 'daily' then 'normal' else 'item' end,
      jsonb_build_object('rank', r.rank, 'tickets', v_n, 'paid', v_paid));
  end loop;

  if v_out = '{}'::jsonb then
    return jsonb_build_object('has_result', false);
  end if;
  select free_tickets, paid_tickets into v_free, v_paid_bal from game_gacha_wallet where player_hash = p_player_hash;
  return jsonb_build_object(
    'has_result', true, 'week_start', v_week_start, 'tickets', v_out, 'total_tickets', v_total,
    'free_tickets', coalesce(v_free, 0), 'paid_tickets', coalesce(v_paid_bal, 0));
end $$;
revoke execute on function game_claim_week_tickets(text) from public, anon, authenticated;
grant  execute on function game_claim_week_tickets(text) to service_role;

-- ── 유상 이용권 구매 (CP 차감 → 유상 지갑 증가, 원자적) — 재화 가챠 전용 재화 ──
create or replace function game_gacha_buy_ticket(p_player_hash text, p_qty int)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_price int; v_cost int; v_point int; v_free int; v_paid int;
begin
  if p_qty is null or p_qty <= 0 or p_qty > 99 then return jsonb_build_object('error', 'bad_qty'); end if;
  v_price := coalesce((select (config -> 'rewards' ->> 'ticketPrice')::int from game_config where id = 1), 500);
  if v_price < 1 then return jsonb_build_object('error', 'bad_price'); end if;
  v_cost := v_price * p_qty;

  -- 잔액 확인 + 차감 (원자적 — 부족하면 update 0행, game_buy_item 패턴)
  update game_wallet set celeb_point = celeb_point - v_cost, updated_at = now()
  where player_hash = p_player_hash and celeb_point >= v_cost
  returning celeb_point into v_point;
  if not found then return jsonb_build_object('error', 'insufficient'); end if;

  insert into game_point_ledger (player_hash, delta, reason) values (p_player_hash, -v_cost, 'buy:gacha_ticket:' || p_qty);

  insert into game_gacha_wallet (player_hash, paid_tickets)
  values (p_player_hash, p_qty)
  on conflict (player_hash) do update
    set paid_tickets = game_gacha_wallet.paid_tickets + excluded.paid_tickets, updated_at = now();
  insert into game_gacha_ticket_ledger (player_hash, delta_paid, reason) values (p_player_hash, p_qty, 'buy:' || p_qty);

  select free_tickets, paid_tickets into v_free, v_paid from game_gacha_wallet where player_hash = p_player_hash;
  return jsonb_build_object('celeb_point', v_point, 'free_tickets', v_free, 'paid_tickets', v_paid);
end $$;
revoke execute on function game_gacha_buy_ticket(text, int) from public, anon, authenticated;
grant  execute on function game_gacha_buy_ticket(text, int) to service_role;

notify pgrst, 'reload schema';
