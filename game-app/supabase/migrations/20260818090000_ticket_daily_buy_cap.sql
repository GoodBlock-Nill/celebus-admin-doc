-- ─────────────────────────────────────────────────────────────
-- 042: 드로우 티켓 구매 일일 한도 — 1회차 럭키드로우가 CP 구매 티켓(전체 소모의 82%)로
--   4일 만에 소진된 데이터에 근거, 헤비 유저의 하루 소진량을 제한해 이벤트 지속성과
--   참여 기회 분산을 확보한다. 한도는 rewards.ticketDailyBuyCap (기본 10, 0=무제한, KST 일 기준).
--   game_gacha_buy_ticket 재정의 — 시그니처·반환 형태 유지(순수 검증 추가), 공유 DB 수칙 준수.
-- ─────────────────────────────────────────────────────────────

create or replace function game_gacha_buy_ticket(p_player_hash text, p_qty int)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_price int; v_cost int; v_point int; v_free int; v_paid int; v_cap int; v_today int;
begin
  if p_qty is null or p_qty <= 0 or p_qty > 99 then return jsonb_build_object('error', 'bad_qty'); end if;
  v_price := coalesce((select (config -> 'rewards' ->> 'ticketPrice')::int from game_config where id = 1), 500);
  if v_price < 1 then return jsonb_build_object('error', 'bad_price'); end if;
  v_cost := v_price * p_qty;

  -- 일일 구매 한도 (KST) — 오늘 구매 누적 + 이번 요청이 한도를 넘으면 거부
  v_cap := coalesce((select (config -> 'rewards' ->> 'ticketDailyBuyCap')::int from game_config where id = 1), 10);
  if v_cap > 0 then
    select coalesce(sum(delta_paid), 0) into v_today
    from game_gacha_ticket_ledger
    where player_hash = p_player_hash and delta_paid > 0 and reason like 'buy:%'
      and created_at >= date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';
    if v_today + p_qty > v_cap then
      return jsonb_build_object('error', 'daily_cap', 'cap', v_cap, 'left', greatest(v_cap - v_today, 0));
    end if;
  end if;

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
