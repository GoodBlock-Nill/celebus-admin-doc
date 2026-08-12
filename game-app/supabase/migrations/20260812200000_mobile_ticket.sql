-- ─────────────────────────────────────────────────────────────
-- 040: 모바일 티켓 보상 (사용자 결정 2026-08-12)
--   콘서트 초대권은 실물 배송이 아니라 CELEBUS 앱 입장용 모바일 티켓 — 콘서트 일정 확정 후
--   당첨자의 CELEBUS 계정으로 지급. 수령 정보 입력이 불필요하므로:
--   · 당첨 즉시 status='submitted'(지급 대기)로 생성 — pending·기한 만료 무효 개념 미적용
--   · snapshot에 celebus_uid 보존 — 운영자가 당첨자 테이블에서 지급 대상 즉시 확인
--   실물 풀 아이템에 지급 방식(fulfillment) 구분 추가: delivery(배송, 주소 필요 가능) / mobile_ticket
-- ─────────────────────────────────────────────────────────────

alter table game_gacha_pool_item
  add column if not exists fulfillment text not null default 'delivery'
  check (fulfillment in ('delivery', 'mobile_ticket'));

-- ── 뽑기 RPC 재작성 — physical 당첨 생성 시 fulfillment 반영 ──
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
  v_bonus_paid boolean;
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

  if v_ev.kind = 'digital' then
    -- ── 재화 확률형: 가중치 추첨, 무상 우선 + 유상 허용, p_count 전량 뽑기 ──
    if v_free + v_paid < p_count then return jsonb_build_object('error', 'insufficient_tickets'); end if;
    v_use_free := least(v_free, p_count);
    v_use_paid := p_count - v_use_free;

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
      values (p_player_hash, p_event_id, r.id, i > v_use_free)
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
    -- ── 실물 박스: 무상 이용권 전용 (사행성 분리 — 유상 사용 원천 차단) ──
    if v_free < p_count then return jsonb_build_object('error', 'need_free_tickets'); end if;

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
      values (p_player_hash, p_event_id, r.id, false)
      returning id into v_draw_id;

      v_winner_id := null;
      if r.is_physical then
        -- 모바일 티켓: 수령 정보 불필요 → 즉시 지급 대기(submitted). CELEBUS UID를 스냅샷에 보존.
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
    v_use_free := v_actual; v_use_paid := 0;

    select coalesce(sum(remaining_qty), 0) into v_remaining
    from game_gacha_pool_item where event_id = p_event_id;
    if v_remaining = 0 then
      update game_gacha_event set status = 'ended', updated_at = now() where id = p_event_id;
    end if;
  end if;

  update game_gacha_wallet
  set free_tickets = free_tickets - v_use_free, paid_tickets = paid_tickets - v_use_paid, updated_at = now()
  where player_hash = p_player_hash;
  insert into game_gacha_ticket_ledger (player_hash, delta_free, delta_paid, reason)
  values (p_player_hash, -v_use_free, -v_use_paid, 'draw:' || p_event_id || ':x' || v_actual);

  if p_count = 10 and v_actual = 10 then
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
