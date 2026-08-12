-- ─────────────────────────────────────────────────────────────
-- 039: 실물 박스 가챠 (Phase 4 — docs/weekly-rank-prize-reward-plan.md §3-1·§4·§8)
--   박스 가챠 = 재고 소진형: 남은 상품 중 균등 확률(잔여 수량 비례), 뽑힐 때마다 소진, 전체 소진 시 이벤트 종료.
--   무상 이용권 전용(사행성 분리 — CP 구매 유상 이용권 사용 불가, RPC가 강제).
--   1인 당첨 상한(per_user_cap): 상한 도달 아이템은 해당 유저의 추첨에서 제외 (콘서트 초대권 = 2매).
--   실물 당첨 → game_prize_winner 생성(수령 기한) → 앱 내 수령 정보 입력(game_prize_claim_info, 개인정보 격리).
-- ─────────────────────────────────────────────────────────────

-- 실물 당첨 건 (뽑기 1건 = 당첨 1건, 불변 지향 스냅샷)
create table if not exists game_prize_winner (
  id             uuid primary key default gen_random_uuid(),
  draw_id        uuid not null unique references game_gacha_draw(id),
  player_hash    text not null,
  snapshot       jsonb not null,   -- {prize, grade, nickname} 당첨 시점 값 (이후 프로필 변경과 무관하게 보존)
  status         text not null default 'pending'
                 check (status in ('pending', 'submitted', 'shipped', 'expired', 'revoked')),
  claim_deadline timestamptz not null,
  submitted_at   timestamptz,
  shipped_at     timestamptz,
  admin_memo     text,             -- 송장·무효 사유 등
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_prize_winner_player on game_prize_winner (player_hash, created_at desc);
alter table game_prize_winner enable row level security;

-- 수령 정보 (개인정보 격리 — 파기 시 이 테이블 행만 삭제, 당첨 이력은 snapshot으로 유지)
create table if not exists game_prize_claim_info (
  winner_id  uuid primary key references game_prize_winner(id) on delete cascade,
  name       text not null,
  phone      text not null,
  address    text,
  note       text,
  agreed_at  timestamptz not null,  -- 개인정보 수집·이용 동의 시각 (목적: 상품 발송, 발송 완료 후 90일 파기)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table game_prize_claim_info enable row level security;

-- ── 뽑기 RPC 재작성 — digital(가중치 확률형) + physical_box(재고 소진형) 통합 ──
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
  v_nick text; v_remaining bigint;
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

    -- 풀 행 잠금 (동시 뽑기 경합 직렬화 — 마지막 재고는 먼저 커밋한 쪽이 당첨)
    perform 1 from game_gacha_pool_item where event_id = p_event_id for update;
    select nickname into v_nick from game_profiles where player_hash = p_player_hash;

    for i in 1..p_count loop
      -- 추첨 대상: 잔여 있음 + 1인 상한 미도달 (같은 트랜잭션 내 직전 뽑기도 상한에 반영, revoked 건은 제외)
      select coalesce(sum(remaining_qty), 0) into v_total_w
      from game_gacha_pool_item p
      where p.event_id = p_event_id and p.remaining_qty > 0
        and (p.per_user_cap is null or p.per_user_cap >
          (select count(*) from game_gacha_draw d
             left join game_prize_winner w on w.draw_id = d.id
           where d.player_hash = p_player_hash and d.pool_item_id = p.id
             and (w.id is null or w.status <> 'revoked')));
      exit when v_total_w <= 0; -- 이 유저가 뽑을 수 있는 상품 없음 — 남은 횟수 미차감

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
        insert into game_prize_winner (draw_id, player_hash, snapshot, claim_deadline)
        values (v_draw_id, p_player_hash,
                jsonb_build_object('prize', r.prize, 'grade', r.grade, 'nickname', coalesce(v_nick, '')),
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
        'requires_address', r.requires_address);
      v_actual := v_actual + 1;
    end loop;

    if v_actual = 0 then return jsonb_build_object('error', 'no_stock'); end if;
    v_use_free := v_actual; v_use_paid := 0; -- 실제 뽑은 만큼만 차감 (재고 부족 시 차액 미차감)

    -- 박스 전체 소진 시 이벤트 자동 종료
    select coalesce(sum(remaining_qty), 0) into v_remaining
    from game_gacha_pool_item where event_id = p_event_id;
    if v_remaining = 0 then
      update game_gacha_event set status = 'ended', updated_at = now() where id = p_event_id;
    end if;
  end if;

  -- 이용권 차감 + 원장
  update game_gacha_wallet
  set free_tickets = free_tickets - v_use_free, paid_tickets = paid_tickets - v_use_paid, updated_at = now()
  where player_hash = p_player_hash;
  insert into game_gacha_ticket_ledger (player_hash, delta_free, delta_paid, reason)
  values (p_player_hash, -v_use_free, -v_use_paid, 'draw:' || p_event_id || ':x' || v_actual);

  -- 10연 완주 보너스 1장 — 유형은 소모분 승계 (유상 포함 시 유상 = 유상→무상 전환 차단)
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

  -- CP 일괄 지급 + 포인트 원장
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
