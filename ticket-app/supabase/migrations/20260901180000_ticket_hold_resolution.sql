-- ══════════════════════════════════════════════════════════════════════════
-- 확인 보류(ON_HOLD) 해결 플로우
--
-- 배경: 확인 보류에 놓인 회원은 이미 송금을 마쳤고 무언가를 잘못 적은 상태다.
--       기존 화면은 재송금만 유도해 다음 단계를 돕지 못했다.
--       사유(입금자명 불일치 / 금액 불일치)에 따라
--         · 입금자명 불일치 → 회원이 "실제로 쓴 입금자명"을 알려주면 운영자가 그 이름으로 대조
--         · 금액 불일치     → 회원이 환불받을 계좌를 등록하고, 원하면 정확한 금액으로 재송금
--       두 갈래로 나누기 위해 회원 제출 정보를 주문에 저장한다.
--
-- 함께 반영: 입금 확인중(DEPOSIT_REPORTED) 예매는 회원이 바로 취소할 수 없도록 막는다.
--            (운영자가 대조 중인 건이 갑자기 사라지면 입금 대사가 어긋난다)
--
-- 멱등: add column if not exists / create or replace 만 사용 — 재실행 안전.
-- ══════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════
-- 1. 주문 확장 — 확인 보류 해결에 필요한 회원 제출 정보
-- ══════════════════════════════════════════════════════════════════════════

alter table ticket_orders
  -- 회원이 실제로 송금에 사용한 입금자명 (운영자 은행 내역 대조용)
  add column if not exists hold_actual_depositor  text,
  -- 오입금 환불 계좌 — 계좌번호는 암호화 보관(전화번호와 동일 방식), 조회는 마스킹만
  add column if not exists refund_bank            text,
  add column if not exists refund_account_enc     text,
  add column if not exists refund_holder          text,
  add column if not exists hold_info_submitted_at timestamptz;

comment on column ticket_orders.hold_actual_depositor is '회원이 알린 실제 입금자명 (확인 보류 대조용)';
comment on column ticket_orders.refund_bank         is '오입금 환불 계좌 은행명';
comment on column ticket_orders.refund_account_enc  is '오입금 환불 계좌번호 (암호문, 서버에서만 복호)';
comment on column ticket_orders.refund_holder       is '오입금 환불 계좌 예금주';
comment on column ticket_orders.hold_info_submitted_at is '회원이 보류 해결 정보를 마지막으로 제출한 시각';

-- ══════════════════════════════════════════════════════════════════════════
-- 2. 회원 액션 — 보류 해결 정보 제출
--   · 본인 예매 + 확인 보류·취소 요청 상태에서만 허용
--     (환불 계좌는 취소·환불 흐름에서도 재사용하므로 CANCEL_REQUESTED를 함께 허용)
--   · null 파라미터는 기존 값을 유지 → 입금자명만 / 계좌만 부분 제출 가능
--   · 상태는 바꾸지 않는다. 대조는 운영자가 수행한다.
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
  if v_order.status not in ('ON_HOLD', 'CANCEL_REQUESTED') then
    return jsonb_build_object('ok', false, 'reason', '확인 보류 또는 취소 요청 상태에서만 알려주실 수 있습니다.');
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
-- 3. 회원 취소 재정의 — 입금 확인중 예매는 취소할 수 없다
--   · 운영자가 입금 내역을 대조하는 중에 예매가 사라지면 입금 대사가 어긋난다.
--   · 회원은 "입금확인 요청 취소" 후에 예매를 취소하면 된다.
--   · 확인 보류는 종전대로 즉시 취소 가능(입금 처리는 별도 환불 절차로 이어진다).
-- ══════════════════════════════════════════════════════════════════════════

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
