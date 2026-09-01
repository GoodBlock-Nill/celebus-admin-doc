-- ─────────────────────────────────────────────────────────────────────────────
-- CELEBUS 예매 웹 (ticket-app) — 입금 확인 요청(회원 신호) 상태 도입
--
-- 진행 상태 흐름
--   입금 대기(AWAITING_DEPOSIT)
--     → [회원] 입금확인 요청 → 입금 확인중(DEPOSIT_REPORTED)
--     → [운영자] 입금 확인      → 입금 확인(DEPOSIT_CONFIRMED)
--     → [운영자] 티켓 지급      → 티켓 지급(PAID)
--
-- 설계 원칙
--   ① 요청은 게이트가 아니라 신호다. 운영자는 요청이 없어도 입금 대조만으로
--      입금 대기 → 입금 확인으로 곧장 처리할 수 있다.
--   ② 요청이 접수된 예매는 마감 시각이 지나도 자동 취소하지 않는다(운영자 판단 대기).
--      요청 이력(deposit_reported_at)이 남아 있는 동안에는 보류 상태도 자동 취소 대상에서 뺀다.
--   ③ 회원의 오클릭 대비 — 요청 취소로 입금 대기에 되돌릴 수 있다.
--   ④ 운영자는 미입금 반려로 입금 대기에 되돌리며, 반려 시각을 남겨 회원 화면에 안내한다.
--
-- 재실행 안전(idempotent) — add column if not exists / create or replace 기반.
-- ─────────────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════════════════
-- 1. 스키마 확장 — 상태값 추가 + 요청·반려 시각
-- ══════════════════════════════════════════════════════════════════════════

do $$
declare v_name text;
begin
  select conname into v_name
    from pg_constraint
   where conrelid = 'ticket_orders'::regclass
     and contype = 'c'
     and pg_get_constraintdef(oid) like '%AWAITING_DEPOSIT%';

  if v_name is not null then
    execute format('alter table ticket_orders drop constraint %I', v_name);
  end if;
end $$;

alter table ticket_orders
  add constraint ticket_orders_status_check check (status in (
    'AWAITING_DEPOSIT', 'DEPOSIT_REPORTED', 'ON_HOLD', 'DEPOSIT_CONFIRMED',
    'PAID', 'EXPIRED', 'CANCEL_REQUESTED', 'REFUNDED'));

-- 회원이 "입금했어요"를 알린 시각. 요청이 취소·반려되면 다시 비운다.
alter table ticket_orders add column if not exists deposit_reported_at timestamptz;
-- 운영자가 미입금으로 반려한 시각. 회원 예매 상세의 재요청 안내에 쓴다.
alter table ticket_orders add column if not exists report_rejected_at  timestamptz;

-- ══════════════════════════════════════════════════════════════════════════
-- 2. 1인 구매 한도 — 입금 확인중 예매도 좌석을 잡고 있으므로 한도에 포함한다
-- ══════════════════════════════════════════════════════════════════════════

create or replace function ticket_held_qty(p_member_id uuid, p_concert_id uuid)
returns integer language sql stable as $$
  select coalesce((
    select sum(o.qty)::int from ticket_orders o
    where o.member_id = p_member_id
      and o.concert_id = p_concert_id
      and o.status in ('AWAITING_DEPOSIT', 'DEPOSIT_REPORTED', 'ON_HOLD',
                       'DEPOSIT_CONFIRMED', 'PAID', 'CANCEL_REQUESTED')
  ), 0) + coalesce((
    select count(*)::int from ticket_tickets t
    where t.member_id = p_member_id
      and t.concert_id = p_concert_id
      and t.order_id is null
      and t.status <> 'REVOKED'
  ), 0);
$$;

revoke execute on function ticket_held_qty(uuid, uuid) from public, anon, authenticated;

-- ══════════════════════════════════════════════════════════════════════════
-- 3. 입금 마감 자동 취소 — 입금 확인 요청 건은 제외
--    입금 확인중(DEPOSIT_REPORTED)은 애초에 대상 상태가 아니고,
--    요청 뒤 입금자명 불일치로 보류된 예매도 요청 이력이 남아 있으면 자동 취소하지 않는다.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function ticket_expire_overdue_orders()
returns integer
language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  with overdue as (
    update ticket_orders
       set status = 'EXPIRED'
     where status in ('AWAITING_DEPOSIT', 'ON_HOLD')
       and deposit_deadline < now()
       and deposit_reported_at is null
    returning id, order_no, session_id, qty
  ),
  released as (
    update ticket_session_pools p
       set reserved = greatest(p.reserved - agg.qty, 0),
           updated_at = now()
      from (select session_id, sum(qty)::int as qty from overdue group by session_id) agg
     where p.session_id = agg.session_id
       and p.pool_type = 'PAID_SALE'
    returning p.id
  ),
  logged as (
    insert into ticket_admin_logs (actor, action, detail)
    select '시스템', '입금 마감 자동 취소',
           '주문 ' || o.order_no || ' 입금 미확인으로 자동 취소되었습니다.'
      from overdue o
    returning id
  )
  select count(*)::int into v_count from overdue;

  return coalesce(v_count, 0);
end $$;

revoke execute on function ticket_expire_overdue_orders() from public, anon, authenticated;
grant  execute on function ticket_expire_overdue_orders() to service_role;

-- 공개 잔여 좌석 뷰 — 자동 취소 대상과 판정 기준을 반드시 같게 맞춘다.
-- 자동 취소에서 뺀 예매(입금 확인 요청 건)를 잔여로 되돌리면 초과 판매가 생긴다.
drop view if exists ticket_public_sessions;

create view ticket_public_sessions as
select
  s.id,
  s.concert_id,
  s.name,
  s.start_at,
  s.entry_open_minutes_before,
  p.allocated,
  p.reserved,
  p.issued,
  greatest(p.allocated - p.reserved - p.issued + coalesce(x.overdue_qty, 0), 0) as remaining
from ticket_concert_sessions s
join ticket_session_pools p
  on p.session_id = s.id and p.pool_type = 'PAID_SALE'
left join lateral (
  select sum(o.qty)::int as overdue_qty
  from ticket_orders o
  where o.session_id = s.id
    and o.status in ('AWAITING_DEPOSIT', 'ON_HOLD')
    and o.deposit_deadline < now()
    and o.deposit_reported_at is null
) x on true;

grant select on ticket_public_sessions to anon, authenticated;

-- ══════════════════════════════════════════════════════════════════════════
-- 4. 회원 액션 — 입금확인 요청 / 요청 취소
-- ══════════════════════════════════════════════════════════════════════════

create or replace function ticket_report_deposit(
  p_order_id  uuid,
  p_member_id uuid
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order  ticket_orders;
  v_member ticket_members;
  v_actor  text;
begin
  select * into v_order from ticket_orders where id = p_order_id and member_id = p_member_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '주문을 찾을 수 없습니다.');
  end if;
  if v_order.status = 'DEPOSIT_REPORTED' then
    return jsonb_build_object('ok', false, 'reason', '이미 입금 확인을 요청했습니다.');
  end if;
  if v_order.status <> 'AWAITING_DEPOSIT' then
    return jsonb_build_object('ok', false, 'reason', '입금 대기 상태에서만 입금 확인을 요청할 수 있습니다.');
  end if;

  update ticket_orders
     set status = 'DEPOSIT_REPORTED',
         deposit_reported_at = now(),
         report_rejected_at  = null
   where id = p_order_id
  returning * into v_order;

  select * into v_member from ticket_members where id = p_member_id;
  v_actor := coalesce(nullif(v_member.nickname, ''), v_member.celebus_uid, '회원');

  perform ticket_log(v_actor, '입금 확인 요청',
    '주문 ' || v_order.order_no || ' · ' || ticket_krw(v_order.amount_krw) || ' 입금 확인을 요청했습니다.');

  return jsonb_build_object(
    'ok', true,
    'status', v_order.status,
    'deposit_reported_at', v_order.deposit_reported_at
  );
end $$;

revoke execute on function ticket_report_deposit(uuid, uuid) from public, anon, authenticated;
grant  execute on function ticket_report_deposit(uuid, uuid) to service_role;

create or replace function ticket_cancel_deposit_report(
  p_order_id  uuid,
  p_member_id uuid
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order  ticket_orders;
  v_member ticket_members;
  v_actor  text;
begin
  select * into v_order from ticket_orders where id = p_order_id and member_id = p_member_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '주문을 찾을 수 없습니다.');
  end if;
  if v_order.status <> 'DEPOSIT_REPORTED' then
    return jsonb_build_object('ok', false, 'reason', '입금 확인 요청 상태의 주문만 취소할 수 있습니다.');
  end if;

  update ticket_orders
     set status = 'AWAITING_DEPOSIT',
         deposit_reported_at = null
   where id = p_order_id;

  select * into v_member from ticket_members where id = p_member_id;
  v_actor := coalesce(nullif(v_member.nickname, ''), v_member.celebus_uid, '회원');

  perform ticket_log(v_actor, '입금 확인 요청 취소',
    '주문 ' || v_order.order_no || ' 입금 확인 요청을 취소했습니다.');

  return jsonb_build_object('ok', true, 'status', 'AWAITING_DEPOSIT');
end $$;

revoke execute on function ticket_cancel_deposit_report(uuid, uuid) from public, anon, authenticated;
grant  execute on function ticket_cancel_deposit_report(uuid, uuid) to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 5. 운영자 액션 — 미입금 반려 (입금 대기로 되돌리고 반려 시각을 남긴다)
-- ══════════════════════════════════════════════════════════════════════════

create or replace function ticket_reject_deposit_report(
  p_order_id uuid,
  p_admin    text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_order ticket_orders;
begin
  select * into v_order from ticket_orders where id = p_order_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '주문을 찾을 수 없습니다.');
  end if;
  if v_order.status <> 'DEPOSIT_REPORTED' then
    return jsonb_build_object('ok', false, 'reason', '입금 확인 요청 상태의 주문만 반려할 수 있습니다.');
  end if;

  update ticket_orders
     set status = 'AWAITING_DEPOSIT',
         deposit_reported_at = null,
         report_rejected_at  = now()
   where id = p_order_id;

  perform ticket_log(p_admin, '입금 미확인 반려',
    '주문 ' || v_order.order_no || ' 입금이 확인되지 않아 입금 대기로 되돌렸습니다.');

  return jsonb_build_object('ok', true, 'order_no', v_order.order_no, 'status', 'AWAITING_DEPOSIT');
end $$;

revoke execute on function ticket_reject_deposit_report(uuid, text) from public, anon, authenticated;
grant  execute on function ticket_reject_deposit_report(uuid, text) to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 6. 기존 입금 처리 확장 — 요청 여부와 무관하게 입금 대조·확정이 되도록 한다
-- ══════════════════════════════════════════════════════════════════════════

-- 6-①. 입금 등록 자동 대조 — 대조 후보에 입금 확인중 예매를 포함한다.
create or replace function ticket_register_deposit(
  p_depositor_name text,
  p_amount         integer
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_name    text := btrim(coalesce(p_depositor_name, ''));
  v_order   ticket_orders;
  v_deposit ticket_deposits;
  v_status  text;
  v_matched uuid := null;
  v_hold    uuid := null;
  v_memo    text := null;
begin
  if v_name = '' then
    return jsonb_build_object('ok', false, 'reason', '입금자명을 입력해 주세요.');
  end if;
  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('ok', false, 'reason', '입금액을 확인해 주세요.');
  end if;

  -- 마감 경과 주문을 먼저 정리해야 "마감 이후 입금 = 반환 대상" 판정이 성립한다.
  perform ticket_expire_overdue_orders();

  -- ① 금액·입금자명 모두 일치하는 입금 대기·입금 확인중 주문
  select o.* into v_order
    from ticket_orders o
    join ticket_identity_verifications v on v.member_id = o.member_id
   where o.status in ('AWAITING_DEPOSIT', 'DEPOSIT_REPORTED')
     and o.amount_krw = p_amount
     and (
       ticket_norm_name(v_name) = ticket_norm_name(v.real_name)
       or ticket_norm_name(v_name) = ticket_norm_name(v.real_name) || right(o.order_no, 4)
     )
   order by o.created_at asc, o.id asc
   limit 1;

  if found then
    v_status  := 'AUTO_MATCHED';
    v_matched := v_order.id;
  else
    -- ② 금액만 일치하는 입금 대기·입금 확인중 주문 → 보류
    select o.* into v_order
      from ticket_orders o
     where o.status in ('AWAITING_DEPOSIT', 'DEPOSIT_REPORTED')
       and o.amount_krw = p_amount
     order by o.created_at asc, o.id asc
     limit 1;

    if found then
      v_status  := 'HELD';
      v_matched := v_order.id;
      v_hold    := v_order.id;
      v_memo    := '입금자명 불일치';
    elsif exists (
      select 1 from ticket_orders
       where status = 'EXPIRED' and amount_krw = p_amount
    ) then
      v_status := 'REFUND_TARGET';
      v_memo   := '입금 마감 이후 입금 — 반환 대상';
    else
      v_status := 'UNMATCHED';
      v_memo   := '대조 가능한 주문 없음';
    end if;
  end if;

  insert into ticket_deposits (depositor_name, amount_krw, status, matched_order_id, memo)
  values (v_name, p_amount, v_status, v_matched, v_memo)
  returning * into v_deposit;

  if v_hold is not null then
    update ticket_orders
       set status = 'ON_HOLD', hold_reason = '입금자명 불일치'
     where id = v_hold;
  end if;

  perform ticket_log('시스템', '입금 자동 대조',
    v_name || ' · ' || ticket_krw(p_amount) || ' · 결과 ' || v_status);

  return jsonb_build_object(
    'ok', true,
    'deposit_id', v_deposit.id,
    'status', v_deposit.status,
    'matched_order_id', v_deposit.matched_order_id,
    'memo', v_deposit.memo
  );
end $$;

revoke execute on function ticket_register_deposit(text, integer) from public, anon, authenticated;
grant  execute on function ticket_register_deposit(text, integer) to service_role;

-- 6-②. 입금 확정 — 요청 여부와 무관하게 입금 대기·입금 확인중·보류 주문을 확정한다.
create or replace function ticket_confirm_deposit(
  p_deposit_id uuid,
  p_admin      text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_deposit ticket_deposits;
  v_order   ticket_orders;
begin
  select * into v_deposit from ticket_deposits where id = p_deposit_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '입금 내역을 찾을 수 없습니다.');
  end if;
  if v_deposit.status not in ('AUTO_MATCHED', 'HELD') then
    return jsonb_build_object('ok', false, 'reason', '대조 완료 또는 보류 상태의 입금만 확정할 수 있습니다.');
  end if;

  select * into v_order from ticket_orders where id = v_deposit.matched_order_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '연결된 주문이 없습니다. 먼저 수동 매칭해 주세요.');
  end if;
  if v_order.status not in ('AWAITING_DEPOSIT', 'DEPOSIT_REPORTED', 'ON_HOLD') then
    return jsonb_build_object('ok', false, 'reason', '입금 확정이 가능한 주문 상태가 아닙니다.');
  end if;

  update ticket_deposits set status = 'CONFIRMED' where id = p_deposit_id;

  update ticket_orders
     set status = 'DEPOSIT_CONFIRMED',
         hold_reason = null,
         report_rejected_at = null,
         confirmed_deposit_id = p_deposit_id,
         deposit_confirmed_at = now()
   where id = v_order.id;

  perform ticket_log(p_admin, '입금 확정',
    '주문 ' || v_order.order_no || ' 입금 확정 · 티켓 지급 대기로 전환');

  return jsonb_build_object('ok', true, 'order_id', v_order.id, 'order_no', v_order.order_no);
end $$;

revoke execute on function ticket_confirm_deposit(uuid, text) from public, anon, authenticated;
grant  execute on function ticket_confirm_deposit(uuid, text) to service_role;

-- 6-③. 입금 보류 — 입금 확인중 주문도 보류 대상에 포함한다(요청 이력은 유지).
create or replace function ticket_hold_deposit(
  p_deposit_id uuid,
  p_memo       text,
  p_admin      text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_deposit ticket_deposits;
begin
  select * into v_deposit from ticket_deposits where id = p_deposit_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '입금 내역을 찾을 수 없습니다.');
  end if;
  if v_deposit.status in ('CONFIRMED', 'REFUNDED') then
    return jsonb_build_object('ok', false, 'reason', '이미 처리된 입금은 보류할 수 없습니다.');
  end if;

  update ticket_deposits set status = 'HELD', memo = p_memo where id = p_deposit_id;

  update ticket_orders
     set status = 'ON_HOLD', hold_reason = p_memo
   where id = v_deposit.matched_order_id
     and status in ('AWAITING_DEPOSIT', 'DEPOSIT_REPORTED');

  perform ticket_log(p_admin, '입금 보류',
    v_deposit.depositor_name || ' · 사유 ' || coalesce(p_memo, ''));

  return jsonb_build_object('ok', true);
end $$;

revoke execute on function ticket_hold_deposit(uuid, text, text) from public, anon, authenticated;
grant  execute on function ticket_hold_deposit(uuid, text, text) to service_role;

-- 6-④. 수동 매칭 — 되돌릴 때 회원의 요청 이력이 있으면 입금 확인중으로 복원한다.
create or replace function ticket_manual_match(
  p_deposit_id uuid,
  p_order_id   uuid,
  p_admin      text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_deposit  ticket_deposits;
  v_order    ticket_orders;
  v_previous uuid;
begin
  select * into v_deposit from ticket_deposits where id = p_deposit_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '입금 내역을 찾을 수 없습니다.');
  end if;
  if v_deposit.status in ('CONFIRMED', 'REFUNDED') then
    return jsonb_build_object('ok', false, 'reason', '이미 처리된 입금입니다.');
  end if;

  select * into v_order from ticket_orders where id = p_order_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '주문을 찾을 수 없습니다.');
  end if;
  if v_order.status not in ('AWAITING_DEPOSIT', 'DEPOSIT_REPORTED', 'ON_HOLD') then
    return jsonb_build_object('ok', false, 'reason', '입금대기 또는 보류 상태의 주문만 매칭할 수 있습니다.');
  end if;

  v_previous := v_deposit.matched_order_id;

  update ticket_deposits
     set status = 'AUTO_MATCHED', matched_order_id = p_order_id
   where id = p_deposit_id;

  update ticket_orders
     set status = case when deposit_reported_at is null then 'AWAITING_DEPOSIT' else 'DEPOSIT_REPORTED' end,
         hold_reason = null
   where id = p_order_id;

  -- 이전에 잘못 연결돼 보류된 주문은 원래 상태로 되돌린다.
  if v_previous is not null and v_previous <> p_order_id then
    update ticket_orders
       set status = case when deposit_reported_at is null then 'AWAITING_DEPOSIT' else 'DEPOSIT_REPORTED' end,
           hold_reason = null
     where id = v_previous and status = 'ON_HOLD';
  end if;

  perform ticket_log(p_admin, '입금 수동 매칭',
    v_deposit.depositor_name || ' 입금을 주문 ' || v_order.order_no || '에 연결했습니다.');

  return jsonb_build_object('ok', true);
end $$;

revoke execute on function ticket_manual_match(uuid, uuid, text) from public, anon, authenticated;
grant  execute on function ticket_manual_match(uuid, uuid, text) to service_role;

-- 6-⑤. 회원 취소 요청
--   · 입금 확인중 예매도 입금 전 취소(즉시 취소·좌석 반환)로 처리한다.
--   · 티켓 지급은 공연 당일에 이뤄지므로 지급된 예매는 회원 취소·환불 요청 대상에서 제외한다.
create or replace function ticket_request_cancel(
  p_order_id  uuid,
  p_member_id uuid
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order  ticket_orders;
  v_member ticket_members;
  v_actor  text;
begin
  select * into v_order from ticket_orders where id = p_order_id and member_id = p_member_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '주문을 찾을 수 없습니다.');
  end if;

  select * into v_member from ticket_members where id = p_member_id;
  v_actor := coalesce(nullif(v_member.nickname, ''), v_member.celebus_uid, '회원');

  -- 입금대기·입금 확인중·보류 주문은 즉시 취소하고 선점 좌석을 반환한다.
  if v_order.status in ('AWAITING_DEPOSIT', 'DEPOSIT_REPORTED', 'ON_HOLD') then
    update ticket_orders
       set status = 'EXPIRED', hold_reason = null, deposit_reported_at = null
     where id = p_order_id;

    update ticket_session_pools
       set reserved = greatest(reserved - v_order.qty, 0), updated_at = now()
     where session_id = v_order.session_id and pool_type = 'PAID_SALE';

    perform ticket_log(v_actor, '사용자 취소',
      '주문 ' || v_order.order_no || '을(를) 입금 전에 취소했습니다.');

    return jsonb_build_object('ok', true, 'cancelled', true, 'status', 'EXPIRED');
  end if;

  -- 티켓이 지급된 주문은 회원이 취소·환불을 요청할 수 없다.
  if v_order.status = 'PAID' then
    return jsonb_build_object('ok', false, 'reason', '티켓이 지급된 주문은 취소·환불 요청을 할 수 없습니다.');
  end if;

  -- 입금 확인 주문만 취소 요청(24시간 이내 환불 처리)을 접수한다.
  if v_order.status <> 'DEPOSIT_CONFIRMED' then
    return jsonb_build_object('ok', false, 'reason', '취소할 수 있는 상태가 아닙니다.');
  end if;

  update ticket_orders
     set status = 'CANCEL_REQUESTED', cancel_requested_at = now()
   where id = p_order_id;

  perform ticket_log(v_actor, '취소 요청',
    '주문 ' || v_order.order_no || ' 취소를 요청했습니다. (24시간 이내 환불 처리)');

  return jsonb_build_object('ok', true, 'cancelled', false, 'status', 'CANCEL_REQUESTED');
end $$;

revoke execute on function ticket_request_cancel(uuid, uuid) from public, anon, authenticated;
grant  execute on function ticket_request_cancel(uuid, uuid) to service_role;
