-- 환불 승인 좌석 반환 정정 — 지급 취소 이력이 있는 주문의 환불 시 선점 좌석 미반환 버그 수정.
-- 원인: 발급 여부 판정이 회수(REVOKED) 티켓까지 세어, 회수 대상 0매·좌석 반환 생략으로 분기됨.
-- 전체 플로우 최종 검증(2026-09-02)에서 재고 정합 점검이 불일치 1건으로 탐지.

create or replace function ticket_approve_refund(
  p_order_id uuid,
  p_admin    text,
  p_fee_krw  integer default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order     ticket_orders;
  v_quote     jsonb;
  v_fee       integer;
  v_net       integer;
  v_canceled  boolean := false;
  v_total     integer;
  v_revoked   integer;
  v_is_issued boolean;
  v_rows      integer;
begin
  select * into v_order from ticket_orders where id = p_order_id for update;
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

  -- 공연 취소로 생긴 환불은 사업자 귀책이라 운영자 조정값과 무관하게 수수료 0을 강제한다.
  select (c.status = 'CANCELED') into v_canceled
    from ticket_concerts c where c.id = v_order.concert_id;

  v_quote := ticket_refund_fee_quote(v_order);
  v_fee   := case
    when coalesce(v_canceled, false) then 0
    else coalesce(p_fee_krw, (v_quote ->> 'fee_krw')::integer)
  end;

  if v_fee < 0 or v_fee > v_order.amount_krw then
    return jsonb_build_object('ok', false,
      'reason', '환불 수수료는 0원부터 결제 금액까지만 입력할 수 있습니다.');
  end if;
  v_net := v_order.amount_krw - v_fee;

  update ticket_orders
     set status            = 'REFUNDED',
         refunded_at       = now(),
         refund_fee_krw    = v_fee,
         refund_amount_krw = v_net
   where id = p_order_id and status = 'CANCEL_REQUESTED';
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'reason', ticket_stale_state_reason());
  end if;

  -- 살아 있는(미회수) 티켓만 센다 — 지급 취소를 거친 주문은 회수 티켓 행이 남아 있어
  -- 전체 건수로 판정하면 선점 좌석 반환 분기를 놓친다(반환 누수).
  select count(*)::int into v_total
    from ticket_tickets
   where order_id = p_order_id and status <> 'REVOKED';
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

  -- 이 예매의 대금으로 수납한 입금은 모두 반환 처리한다(분할 입금 포함).
  update ticket_deposits
     set status = 'REFUNDED'
   where matched_order_id = p_order_id and status = 'CONFIRMED';

  if v_order.confirmed_deposit_id is not null then
    update ticket_deposits
       set status = 'REFUNDED'
     where id = v_order.confirmed_deposit_id and status = 'CONFIRMED';
  end if;

  perform ticket_log(p_admin, '환불 승인',
    '주문 ' || v_order.order_no || ' 환불 처리 · '
    || case when v_is_issued
         then '티켓 ' || v_revoked || '매 무효화'
         else '티켓 지급 전 취소로 선점 좌석 ' || v_order.qty || '매 반환'
       end
    || ' · 결제 ' || ticket_krw(v_order.amount_krw)
    || ' · 수수료 ' || ticket_krw(v_fee)
    || ' · 실환불 ' || ticket_krw(v_net)
    || ' (' || (v_quote ->> 'basis') || ')');

  return jsonb_build_object(
    'ok', true,
    'revoked_tickets', v_revoked,
    'was_issued', v_is_issued,
    'fee_krw', v_fee,
    'refund_krw', v_net,
    'basis', v_quote ->> 'basis'
  );
end $$;

revoke execute on function ticket_approve_refund(uuid, text, integer) from public, anon, authenticated;

