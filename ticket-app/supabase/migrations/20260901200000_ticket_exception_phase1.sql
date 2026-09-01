-- ══════════════════════════════════════════════════════════════════════════
-- 예매 운영 예외 처리 1단계 — 돈·법적 위험 차단
-- 근거: [CEB-TKT-001-C] 예매 운영 예외 시나리오·플로우 재설계서 §3 원칙 / §4 / §6 Phase 1
--
-- ① 입금 고립 방지 (C-1)
--    연결된 입금이 있는 예매는 입금 마감이 지나도 자동 취소하지 않는다.
--    "입금 사실"의 판정 근거를 회원의 [입금확인 요청] 클릭 하나에서
--    "연결된 입금 건 존재"로 넓힌다(재설계 원칙 ①).
--
-- ② 오입금 자동 보류 + 표준 사유 코드 (B-2 / B-3)
--    입금자명은 맞고 금액만 다른 입금은 지금까지 미대조로 침묵했고,
--    회원은 아무 안내도 받지 못한 채 좌석을 잃었다.
--    이제 예매를 확인 보류로 자동 전환하고 사유를 코드로 남긴다.
--    (화면이 사유 문구를 글자로 뒤져 분기하던 방식을 대체한다)
--
-- ③ 반환 대상 입금의 예매 연결 유지 (B-9 / B-12)
--    마감 이후·취소 이후 입금을 반환 대상으로 분류만 하고 예매 연결을 끊어
--    "누구 돈인지·어디로 돌려줄지" 알 수 없던 문제를 바로잡는다.
--
-- ④ 환불 계좌 선행 (E-2 / C-5)
--    환불 승인은 회원 환불 계좌가 있어야 가능하고,
--    환불이 예정된 예매는 상태와 무관하게 계좌를 등록할 수 있게 연다(재설계 원칙 ②).
--
-- ⑤ 복수 입금 종결 (B-7)
--    한 예매에 두 건이 자동 대조된 경우 2건째를 보류·반환 대상으로 종결할 수 있게
--    상태 가드를 확인한다(확인 대기 상태 입금도 두 손잡이가 받는다).
--
-- 멱등: add column if not exists / create or replace / drop if exists 기반 — 재실행 안전.
-- ══════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════
-- 1. 예매 확장 — 확인 보류 표준 사유 코드
--    NAME=입금자명 불일치 / AMOUNT=입금액 불일치 / BOTH=둘 다 / OTHER=그 밖의 사유
-- ══════════════════════════════════════════════════════════════════════════

alter table ticket_orders add column if not exists hold_cause text;

comment on column ticket_orders.hold_cause is
  '확인 보류 표준 사유 코드 (NAME=입금자명 / AMOUNT=입금액 / BOTH=둘 다 / OTHER=그 밖)';

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'ticket_orders'::regclass
       and conname  = 'ticket_orders_hold_cause_check'
  ) then
    alter table ticket_orders
      add constraint ticket_orders_hold_cause_check
      check (hold_cause is null or hold_cause in ('NAME', 'AMOUNT', 'BOTH', 'OTHER'));
  end if;
end $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 2. C-1 — 입금이 들어온 예매는 자동 취소하지 않는다
--
--    ⚠️ 자동 취소 함수와 공개 잔여 좌석 뷰는 판정 조건을 반드시 같게 유지한다.
--       한쪽만 고치면 "취소되지 않은 예매의 좌석"이 잔여로 되돌아가 초과 판매가 된다.
--       아래 두 곳의 where 절은 글자 그대로 동일해야 한다.
--
--    제외 대상
--      · 회원이 입금확인을 요청한 예매          (deposit_reported_at is not null)
--      · 연결된 입금이 남아 있는 예매           (확인 대기·보류 상태의 입금)
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
       and not exists (
         select 1 from ticket_deposits d
          where d.matched_order_id = ticket_orders.id
            and d.status in ('AUTO_MATCHED', 'HELD')
       )
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

-- 공개 잔여 좌석 뷰 — 위 자동 취소 대상과 판정 기준을 같게 맞춘다.
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
    and not exists (
      select 1 from ticket_deposits d
       where d.matched_order_id = o.id
         and d.status in ('AUTO_MATCHED', 'HELD')
    )
) x on true;

grant select on ticket_public_sessions to anon, authenticated;

-- ══════════════════════════════════════════════════════════════════════════
-- 3. B-2 / B-3 / B-9 / B-12 — 입금 등록 자동 대조 재정의
--
--    대조 순서
--      ① 입금자명·금액 모두 일치하는 진행중 예매        → 확인 대기
--      ② 입금자명은 맞고 금액만 다른 진행중 예매        → 보류 (사유 코드 AMOUNT)
--      ③ 금액만 맞고 입금자명이 다른 진행중 예매        → 보류 (사유 코드 NAME)
--      ④ 금액이 같은 취소·만료 예매                     → 반환 대상 (예매 연결 유지)
--      ⑤ 후보 없음                                      → 미대조
--
--    ②를 ③보다 먼저 보는 이유 — 입금자명은 "누가 보냈는가"를 가리키는 더 강한 신호다.
--    금액만 같은 남의 예매를 먼저 잡으면 엉뚱한 회원의 예매가 보류된다.
-- ══════════════════════════════════════════════════════════════════════════

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
  v_cause   text := null;
  v_memo    text := null;
begin
  if v_name = '' then
    return jsonb_build_object('ok', false, 'reason', '입금자명을 입력해 주세요.');
  end if;
  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('ok', false, 'reason', '입금액을 확인해 주세요.');
  end if;

  -- 마감 경과 예매를 먼저 정리해야 "마감 이후 입금 = 반환 대상" 판정이 성립한다.
  perform ticket_expire_overdue_orders();

  -- ① 금액·입금자명 모두 일치하는 입금 대기·입금 확인중 예매
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
    -- ② 입금자명 규칙은 맞고 금액만 다른 예매 → 보류 (오입금)
    select o.* into v_order
      from ticket_orders o
      join ticket_identity_verifications v on v.member_id = o.member_id
     where o.status in ('AWAITING_DEPOSIT', 'DEPOSIT_REPORTED')
       and o.amount_krw <> p_amount
       and (
         ticket_norm_name(v_name) = ticket_norm_name(v.real_name)
         or ticket_norm_name(v_name) = ticket_norm_name(v.real_name) || right(o.order_no, 4)
       )
     order by o.created_at asc, o.id asc
     limit 1;

    if found then
      v_status  := 'HELD';
      v_matched := v_order.id;
      v_hold    := v_order.id;
      v_cause   := 'AMOUNT';
      v_memo    := '입금액 불일치 — 예매 금액 ' || ticket_krw(v_order.amount_krw)
                   || ' / 입금액 ' || ticket_krw(p_amount);
    else
      -- ③ 금액만 일치하고 입금자명이 다른 예매 → 보류
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
        v_cause   := 'NAME';
        v_memo    := '입금자명 불일치';
      else
        -- ④ 금액이 같은 취소·만료 예매 → 반환 대상 (어느 예매의 돈인지 연결을 남긴다)
        --    입금자명까지 맞는 예매를 우선 연결하고, 없으면 가장 최근에 만료된 예매를 쓴다.
        select o.* into v_order
          from ticket_orders o
          left join ticket_identity_verifications v on v.member_id = o.member_id
         where o.status = 'EXPIRED'
           and o.amount_krw = p_amount
         order by
           case
             when ticket_norm_name(v_name) = ticket_norm_name(v.real_name)
               or ticket_norm_name(v_name) = ticket_norm_name(v.real_name) || right(o.order_no, 4)
             then 0 else 1
           end,
           o.created_at desc, o.id desc
         limit 1;

        if found then
          v_status  := 'REFUND_TARGET';
          v_matched := v_order.id;
          v_memo    := '입금 마감 이후 입금 — 반환 대상';
        else
          v_status := 'UNMATCHED';
          v_memo   := '대조 가능한 주문 없음';
        end if;
      end if;
    end if;
  end if;

  insert into ticket_deposits (depositor_name, amount_krw, status, matched_order_id, memo)
  values (v_name, p_amount, v_status, v_matched, v_memo)
  returning * into v_deposit;

  if v_hold is not null then
    update ticket_orders
       set status = 'ON_HOLD', hold_reason = v_memo, hold_cause = v_cause
     where id = v_hold;
  end if;

  perform ticket_log('시스템', '입금 자동 대조',
    v_name || ' · ' || ticket_krw(p_amount) || ' · 결과 ' || v_status);

  return jsonb_build_object(
    'ok', true,
    'deposit_id', v_deposit.id,
    'status', v_deposit.status,
    'matched_order_id', v_deposit.matched_order_id,
    'hold_cause', v_cause,
    'memo', v_deposit.memo
  );
end $$;

revoke execute on function ticket_register_deposit(text, integer) from public, anon, authenticated;
grant  execute on function ticket_register_deposit(text, integer) to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 4. B-3 / B-7 — 수동 보류에 표준 사유 코드를 붙인다
--    기존 3개 인자 함수는 지운다(같은 이름에 기본값 인자를 더하면 호출이 모호해진다).
--    확인 대기(자동 대조 완료) 입금도 보류로 받아 복수 입금 2건째를 종결할 수 있게 한다.
-- ══════════════════════════════════════════════════════════════════════════

drop function if exists ticket_hold_deposit(uuid, text, text);

create or replace function ticket_hold_deposit(
  p_deposit_id uuid,
  p_memo       text,
  p_admin      text,
  p_cause      text default 'OTHER'
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_deposit ticket_deposits;
  v_cause   text := coalesce(nullif(btrim(coalesce(p_cause, '')), ''), 'OTHER');
begin
  if v_cause not in ('NAME', 'AMOUNT', 'BOTH', 'OTHER') then
    return jsonb_build_object('ok', false, 'reason', '보류 사유 구분을 확인해 주세요.');
  end if;

  select * into v_deposit from ticket_deposits where id = p_deposit_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '입금 내역을 찾을 수 없습니다.');
  end if;
  if v_deposit.status in ('CONFIRMED', 'REFUNDED') then
    return jsonb_build_object('ok', false, 'reason', '이미 처리된 입금은 보류할 수 없습니다.');
  end if;

  update ticket_deposits set status = 'HELD', memo = p_memo where id = p_deposit_id;

  update ticket_orders
     set status = 'ON_HOLD', hold_reason = p_memo, hold_cause = v_cause
   where id = v_deposit.matched_order_id
     and status in ('AWAITING_DEPOSIT', 'DEPOSIT_REPORTED');

  perform ticket_log(p_admin, '입금 보류',
    v_deposit.depositor_name || ' · 사유 ' || coalesce(p_memo, ''));

  return jsonb_build_object('ok', true);
end $$;

revoke execute on function ticket_hold_deposit(uuid, text, text, text) from public, anon, authenticated;
grant  execute on function ticket_hold_deposit(uuid, text, text, text) to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 5. 보류 해제 경로 — 사유 코드도 함께 지운다
-- ══════════════════════════════════════════════════════════════════════════

-- 5-①. 입금 확정
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
         hold_cause = null,
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

-- 5-②. 수동 매칭 — 새로 연결한 예매도, 잘못 묶여 보류됐던 예매도 사유를 지운다
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
         hold_reason = null,
         hold_cause  = null
   where id = p_order_id;

  -- 이전에 잘못 연결돼 보류된 주문은 원래 상태로 되돌린다.
  if v_previous is not null and v_previous <> p_order_id then
    update ticket_orders
       set status = case when deposit_reported_at is null then 'AWAITING_DEPOSIT' else 'DEPOSIT_REPORTED' end,
           hold_reason = null,
           hold_cause  = null
     where id = v_previous and status = 'ON_HOLD';
  end if;

  perform ticket_log(p_admin, '입금 수동 매칭',
    v_deposit.depositor_name || ' 입금을 주문 ' || v_order.order_no || '에 연결했습니다.');

  return jsonb_build_object('ok', true);
end $$;

revoke execute on function ticket_manual_match(uuid, uuid, text) from public, anon, authenticated;
grant  execute on function ticket_manual_match(uuid, uuid, text) to service_role;

-- 5-③. 보류 반려 — 예매를 입금 대기로 되돌리며 사유 코드를 지운다
create or replace function ticket_reject_hold(
  p_order_id uuid,
  p_admin    text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_refund_memo constant text := '보류 반려 — 예매 대조 실패, 환불 계좌로 반환';
  v_order    ticket_orders;
  v_deadline timestamptz;
  v_targets  integer := 0;
begin
  select * into v_order from ticket_orders where id = p_order_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '주문을 찾을 수 없습니다.');
  end if;
  if v_order.status <> 'ON_HOLD' then
    return jsonb_build_object('ok', false, 'reason', '확인 보류 상태의 주문만 보류 반려할 수 있습니다.');
  end if;

  -- 마감이 이미 지났으면 당일 자정까지 연장한다(되돌리자마자 자동 취소되는 것을 막는다).
  v_deadline := case
    when v_order.deposit_deadline < now() then ticket_kst_end_of_day(now())
    else v_order.deposit_deadline
  end;

  -- 이 예매에 묶여 보류된 입금은 반환 대상으로 넘긴다(예매 대금으로 인정하지 않는다).
  -- 매칭 연결은 남겨 둔다 — 환불 계좌를 확인하려면 어느 예매의 입금이었는지 필요하다.
  with marked as (
    update ticket_deposits
       set status = 'REFUND_TARGET',
           memo   = v_refund_memo
     where matched_order_id = p_order_id
       and status = 'HELD'
    returning id
  )
  select count(*)::int into v_targets from marked;

  update ticket_orders
     set status              = 'AWAITING_DEPOSIT',
         hold_reason         = null,
         hold_cause          = null,
         deposit_reported_at = null,
         hold_rejected_at    = now(),
         deposit_deadline    = v_deadline
   where id = p_order_id;

  perform ticket_log(p_admin, '보류 반려',
    '주문 ' || v_order.order_no || ' 입금을 대조하지 못해 입금 대기로 되돌렸습니다. (반환 대상 지정 '
    || v_targets || '건)');

  return jsonb_build_object(
    'ok', true,
    'order_no', v_order.order_no,
    'status', 'AWAITING_DEPOSIT',
    'refund_targets', v_targets,
    'deposit_deadline', v_deadline
  );
end $$;

revoke execute on function ticket_reject_hold(uuid, text) from public, anon, authenticated;
grant  execute on function ticket_reject_hold(uuid, text) to service_role;

-- 5-④. 회원 취소 — 확인 보류 예매를 회원이 직접 취소할 때도 사유 코드를 지운다
--      (취소된 예매에 보류 사유가 남아 있으면 이후 화면·이력이 사실과 어긋난다)
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

  -- 입금 확인중은 운영자 대조가 진행 중이므로 회원 취소를 막는다.
  if v_order.status = 'DEPOSIT_REPORTED' then
    return jsonb_build_object('ok', false,
      'reason', '입금 확인중에는 예매를 취소할 수 없습니다. 먼저 입금확인 요청을 취소해 주세요.');
  end if;

  select * into v_member from ticket_members where id = p_member_id;
  v_actor := coalesce(nullif(v_member.nickname, ''), v_member.celebus_uid, '회원');

  -- 입금대기·보류 주문은 즉시 취소하고 선점 좌석을 반환한다.
  if v_order.status in ('AWAITING_DEPOSIT', 'ON_HOLD') then
    update ticket_orders
       set status = 'EXPIRED',
           hold_reason = null,
           hold_cause = null,
           deposit_reported_at = null
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

-- ══════════════════════════════════════════════════════════════════════════
-- 6. C-5 — 환불이 예정된 예매는 상태와 무관하게 계좌를 등록할 수 있다
--
--    허용 조건 (하나라도 해당하면 제출 가능)
--      · 확인 보류 · 취소 요청 상태
--      · 보류 반려 이력이 있는 예매 (입금 대기로 돌아왔지만 돌려줄 돈이 남아 있다)
--      · 이 예매에 연결된 반환 대상·보류 입금이 있는 예매 (만료·취소 이후 입금 포함)
-- ══════════════════════════════════════════════════════════════════════════

create or replace function ticket_submit_hold_info(
  p_order_id         uuid,
  p_member_id        uuid,
  p_actual_depositor text,
  p_refund_bank      text,
  p_refund_account_enc text,
  p_refund_holder    text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order    ticket_orders;
  v_member   ticket_members;
  v_actor    text;
  v_name     text := nullif(btrim(coalesce(p_actual_depositor, '')), '');
  v_bank     text := nullif(btrim(coalesce(p_refund_bank, '')), '');
  v_account  text := nullif(btrim(coalesce(p_refund_account_enc, '')), '');
  v_holder   text := nullif(btrim(coalesce(p_refund_holder, '')), '');
  v_parts    text[] := '{}';
  v_allowed  boolean;
begin
  if v_name is null and v_bank is null and v_account is null and v_holder is null then
    return jsonb_build_object('ok', false, 'reason', '알려주실 내용을 입력해 주세요.');
  end if;

  -- 환불 계좌는 은행·계좌번호·예금주가 한 묶음이어야 환불이 가능하다.
  if (v_bank is not null or v_account is not null or v_holder is not null)
     and (v_bank is null or v_account is null or v_holder is null) then
    return jsonb_build_object('ok', false, 'reason', '환불 계좌는 은행·계좌번호·예금주를 모두 입력해 주세요.');
  end if;

  select * into v_order from ticket_orders where id = p_order_id and member_id = p_member_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '주문을 찾을 수 없습니다.');
  end if;

  v_allowed :=
    v_order.status in ('ON_HOLD', 'CANCEL_REQUESTED')
    or v_order.hold_rejected_at is not null
    or exists (
      select 1 from ticket_deposits d
       where d.matched_order_id = p_order_id
         and d.status in ('REFUND_TARGET', 'HELD')
    );

  if not v_allowed then
    return jsonb_build_object('ok', false,
      'reason', '지금은 환불 계좌·입금자명을 등록할 수 있는 주문 상태가 아닙니다.');
  end if;

  update ticket_orders
     set hold_actual_depositor  = coalesce(v_name,    hold_actual_depositor),
         refund_bank            = coalesce(v_bank,    refund_bank),
         refund_account_enc     = coalesce(v_account, refund_account_enc),
         refund_holder          = coalesce(v_holder,  refund_holder),
         hold_info_submitted_at = now()
   where id = p_order_id
  returning * into v_order;

  select * into v_member from ticket_members where id = p_member_id;
  v_actor := coalesce(nullif(v_member.nickname, ''), v_member.celebus_uid, '회원');

  if v_name is not null then
    v_parts := v_parts || ('실제 입금자명 ' || v_name);
  end if;
  if v_bank is not null then
    v_parts := v_parts || ('환불 계좌 ' || v_bank || ' · 예금주 ' || v_holder);
  end if;

  perform ticket_log(v_actor, '보류 해결 정보 제출',
    '주문 ' || v_order.order_no || ' · ' || array_to_string(v_parts, ' / '));

  return jsonb_build_object(
    'ok', true,
    'hold_info_submitted_at', v_order.hold_info_submitted_at
  );
end $$;

revoke execute on function ticket_submit_hold_info(uuid, uuid, text, text, text, text)
  from public, anon, authenticated;
grant  execute on function ticket_submit_hold_info(uuid, uuid, text, text, text, text)
  to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 7. E-2 — 환불 승인은 회원 환불 계좌가 있어야 가능하다
--    계좌 없이 "환불 완료"로 기록되면 돈은 그대로인 채 장부만 닫힌다.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function ticket_approve_refund(
  p_order_id uuid,
  p_admin    text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order       ticket_orders;
  v_total       integer;
  v_revoked     integer;
  v_is_issued   boolean;
begin
  select * into v_order from ticket_orders where id = p_order_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '주문을 찾을 수 없습니다.');
  end if;
  if v_order.status <> 'CANCEL_REQUESTED' then
    return jsonb_build_object('ok', false, 'reason', '취소 요청된 주문만 환불 처리할 수 있습니다.');
  end if;
  if coalesce(btrim(coalesce(v_order.refund_account_enc, '')), '') = '' then
    return jsonb_build_object('ok', false,
      'reason', '회원이 환불 계좌를 등록하지 않았습니다. 계좌 등록 후 승인해 주세요.');
  end if;

  select count(*)::int into v_total from ticket_tickets where order_id = p_order_id;
  v_is_issued := v_total > 0;

  with revoked as (
    update ticket_tickets
       set status = 'REVOKED'
     where order_id = p_order_id and status <> 'REVOKED'
    returning id
  )
  select count(*)::int into v_revoked from revoked;

  if v_is_issued then
    update ticket_session_pools
       set issued = greatest(issued - v_revoked, 0), updated_at = now()
     where session_id = v_order.session_id and pool_type = 'PAID_SALE';
  else
    -- 지급 대기 상태에서 취소된 주문은 발급 이력이 없어 선점 좌석을 되돌린다.
    update ticket_session_pools
       set reserved = greatest(reserved - v_order.qty, 0), updated_at = now()
     where session_id = v_order.session_id and pool_type = 'PAID_SALE';
  end if;

  update ticket_orders
     set status = 'REFUNDED', refunded_at = now()
   where id = p_order_id;

  if v_order.confirmed_deposit_id is not null then
    update ticket_deposits set status = 'REFUNDED' where id = v_order.confirmed_deposit_id;
  end if;

  perform ticket_log(p_admin, '환불 승인',
    case when v_is_issued
      then '주문 ' || v_order.order_no || ' 환불 처리 · 티켓 ' || v_revoked || '매 무효화'
      else '주문 ' || v_order.order_no || ' 환불 처리 · 티켓 지급 전 취소로 선점 좌석 ' || v_order.qty || '매 반환'
    end);

  return jsonb_build_object('ok', true, 'revoked_tickets', v_revoked, 'was_issued', v_is_issued);
end $$;

revoke execute on function ticket_approve_refund(uuid, text) from public, anon, authenticated;
grant  execute on function ticket_approve_refund(uuid, text) to service_role;
