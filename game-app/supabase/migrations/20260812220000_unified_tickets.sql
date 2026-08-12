-- ─────────────────────────────────────────────────────────────
-- 041: 드로우 티켓 단일화 (사용자 결정 2026-08-12, 기획안 v2.3)
--   무상/유상 사용처 구분이 유저에게 과도하게 어렵다는 판단 → 모든 뽑기(실물 박스 포함)에서
--   보유 티켓을 단일 풀로 사용. 내부 원장(free/paid 컬럼·used_paid)은 출처 추적용으로 유지.
--   ⚠️ 유의: 기존 무상 전용 제한은 "CP 구매분 → 실물 경품" 사행성 차단 장치였음.
--   현재 CP는 무료 획득 재화라 통합 수용. **CP 실결제(CELB/IAP) 도입 시 법무 재검토 필수** (기획안 v2.3).
-- ─────────────────────────────────────────────────────────────

create or replace function game_gacha_draw_exec(p_player_hash text, p_event_id uuid, p_count int)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_ev record;
  v_free int; v_paid int;
  v_actual int := 0; v_use_free int; v_use_paid int;
  v_total_w bigint; v_pick bigint;
  r record;
  v_cp_sum int := 0;
  v_results jsonb := '[]'::jsonb;
  v_draw_id uuid; v_winner_id uuid;
  v_point int; v_item text; v_qty int;
  v_nick text; v_uid text; v_remaining bigint;
begin
  if p_count is null or p_count not in (1, 10) then return jsonb_build_object('error', 'bad_count'); end if;

  select * into v_ev from game_gacha_event where id = p_event_id;
  if not found or v_ev.status <> 'published'
     or (v_ev.starts_at is not null and v_ev.starts_at > now())
     or (v_ev.ends_at   is not null and v_ev.ends_at   <= now()) then
    return jsonb_build_object('error', 'bad_event');
  end if;

  insert into game_gacha_wallet (player_hash) values (p_player_hash) on conflict do nothing;
  select free_tickets, paid_tickets into v_free, v_paid
  from game_gacha_wallet where player_hash = p_player_hash for update;

  -- 단일 풀 검증 — 종류 무관 (v2.3 통합)
  if v_free + v_paid < p_count then return jsonb_build_object('error', 'insufficient_tickets'); end if;

  if v_ev.kind = 'digital' then
    -- ── 재화 확률형: 가중치 추첨, p_count 전량 뽑기 ──
    select coalesce(sum(weight), 0) into v_total_w
    from game_gacha_pool_item where event_id = p_event_id and weight > 0;
    if v_total_w <= 0 then return jsonb_build_object('error', 'empty_pool'); end if;

    for i in 1..p_count loop
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
      values (p_player_hash, p_event_id, r.id, i > v_free)
      returning id into v_draw_id;

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
        'reward', r.reward_payload, 'physical', false, 'winner_id', null);
      v_actual := v_actual + 1;
    end loop;

  else
    -- ── 실물 박스: 재고 소진형 — 단일 티켓 풀 사용 (v2.3) ──
    perform 1 from game_gacha_pool_item where event_id = p_event_id for update;
    select nickname, celebus_uid into v_nick, v_uid from game_profiles where player_hash = p_player_hash;

    for i in 1..p_count loop
      select coalesce(sum(remaining_qty), 0) into v_total_w
      from game_gacha_pool_item p
      where p.event_id = p_event_id and p.remaining_qty > 0
        and (p.per_user_cap is null or p.per_user_cap >
          (select count(*) from game_gacha_draw d
             left join game_prize_winner w on w.draw_id = d.id
           where d.player_hash = p_player_hash and d.pool_item_id = p.id
             and (w.id is null or w.status <> 'revoked')));
      exit when v_total_w <= 0;

      v_pick := floor(random() * v_total_w)::bigint;
      select p.* into r
      from (
        select p2.*, sum(p2.remaining_qty) over (order by p2.sort asc, p2.id asc) as cum
        from game_gacha_pool_item p2
        where p2.event_id = p_event_id and p2.remaining_qty > 0
          and (p2.per_user_cap is null or p2.per_user_cap >
            (select count(*) from game_gacha_draw d
               left join game_prize_winner w on w.draw_id = d.id
             where d.player_hash = p_player_hash and d.pool_item_id = p2.id
               and (w.id is null or w.status <> 'revoked')))
      ) p
      where p.cum > v_pick
      order by p.cum asc
      limit 1;

      update game_gacha_pool_item set remaining_qty = remaining_qty - 1 where id = r.id;

      insert into game_gacha_draw (player_hash, event_id, pool_item_id, used_paid)
      values (p_player_hash, p_event_id, r.id, i > v_free)
      returning id into v_draw_id;

      v_winner_id := null;
      if r.is_physical then
        insert into game_prize_winner (draw_id, player_hash, snapshot, status, submitted_at, claim_deadline)
        values (v_draw_id, p_player_hash,
                jsonb_build_object('prize', r.prize, 'grade', r.grade, 'nickname', coalesce(v_nick, ''),
                                   'celebus_uid', coalesce(v_uid, ''), 'fulfillment', r.fulfillment),
                case when r.fulfillment = 'mobile_ticket' then 'submitted' else 'pending' end,
                case when r.fulfillment = 'mobile_ticket' then now() else null end,
                now() + make_interval(days => v_ev.claim_days))
        returning id into v_winner_id;
      elsif r.reward_payload ? 'cp' then
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
        'reward', r.reward_payload, 'physical', r.is_physical, 'winner_id', v_winner_id,
        'requires_address', r.requires_address, 'fulfillment', r.fulfillment);
      v_actual := v_actual + 1;
    end loop;

    if v_actual = 0 then return jsonb_build_object('error', 'no_stock'); end if;

    -- 박스 전체 소진 시 이벤트 자동 종료
    select coalesce(sum(remaining_qty), 0) into v_remaining
    from game_gacha_pool_item where event_id = p_event_id;
    if v_remaining = 0 then
      update game_gacha_event set status = 'ended', updated_at = now() where id = p_event_id;
    end if;
  end if;

  -- 티켓 차감 — 실제 뽑은 만큼만, 출처 추적을 위해 무상분부터 소진 (원장은 유지)
  v_use_free := least(v_free, v_actual);
  v_use_paid := v_actual - v_use_free;
  update game_gacha_wallet
  set free_tickets = free_tickets - v_use_free, paid_tickets = paid_tickets - v_use_paid, updated_at = now()
  where player_hash = p_player_hash;
  insert into game_gacha_ticket_ledger (player_hash, delta_free, delta_paid, reason)
  values (p_player_hash, -v_use_free, -v_use_paid, 'draw:' || p_event_id || ':x' || v_actual);

  -- 10연 완주 보너스 1장 — 단일 풀이므로 무상분으로 지급
  if p_count = 10 and v_actual = 10 then
    update game_gacha_wallet set free_tickets = free_tickets + 1, updated_at = now()
    where player_hash = p_player_hash;
    insert into game_gacha_ticket_ledger (player_hash, delta_free, reason)
    values (p_player_hash, 1, 'bonus:' || p_event_id);
  end if;

  if v_cp_sum > 0 then
    insert into game_wallet (player_hash, celeb_point) values (p_player_hash, v_cp_sum)
    on conflict (player_hash) do update
      set celeb_point = game_wallet.celeb_point + excluded.celeb_point, updated_at = now();
    insert into game_point_ledger (player_hash, delta, reason)
    values (p_player_hash, v_cp_sum, 'gacha:' || p_event_id || ':x' || v_actual);
  end if;

  select celeb_point into v_point from game_wallet where player_hash = p_player_hash;
  select free_tickets, paid_tickets into v_free, v_paid from game_gacha_wallet where player_hash = p_player_hash;
  return jsonb_build_object(
    'results', v_results, 'count', v_actual, 'bonus_ticket', (p_count = 10 and v_actual = 10),
    'celeb_point', coalesce(v_point, 0), 'free_tickets', v_free, 'paid_tickets', v_paid);
end $$;
revoke execute on function game_gacha_draw_exec(text, uuid, int) from public, anon, authenticated;
grant  execute on function game_gacha_draw_exec(text, uuid, int) to service_role;

notify pgrst, 'reload schema';
