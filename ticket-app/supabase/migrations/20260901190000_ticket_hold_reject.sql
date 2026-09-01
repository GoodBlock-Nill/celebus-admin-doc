-- ══════════════════════════════════════════════════════════════════════════
-- 확인 보류(ON_HOLD) 반려 — 대조가 끝내 되지 않는 예매를 보류에서 푸는 경로
--
-- 배경: 보류 탭에는 입금 건을 처리하는 손잡이(입금 확인·수동 매칭·반환 지정)만 있어
--       "이 입금은 이 예매의 입금이 아니다"라고 판정한 뒤 예매를 되돌릴 방법이 없었다.
--       그 결과 예매는 보류에 갇히고 회원은 다음에 무엇을 해야 하는지 알 수 없었다.
--
-- 보류 반려의 의미 — 보류된 입금을 이 예매의 입금으로 인정하지 않는다.
--   ① 예매를 확인 보류 → 입금 대기로 되돌린다 (회원이 정확한 금액·입금자명으로 재송금 가능)
--   ② 연결된 보류 입금 건은 반환 대상으로 넘긴다 (회원이 등록한 환불 계좌로 환불)
--   ③ 활동 로그를 남긴다
--   위 세 가지를 한 번에 처리한다(중간 상태가 남지 않는다).
--
-- 마감 보정: 되돌린 시점에 입금 마감이 이미 지났다면 당일 자정(한국 시간)까지 연장한다.
--            지난 마감으로 되돌리면 입금 대기가 되자마자 자동 취소되는 모순이 생긴다.
--
-- 유지·초기화 기준
--   · 유지  — 회원이 알린 실제 입금자명·환불 계좌 (환불 처리에 필요)
--   · 초기화 — 보류 사유, 입금 확인 요청 시각 (대조가 무산됐으므로 요청도 함께 내린다)
--
-- 멱등: add column if not exists / create or replace 만 사용 — 재실행 안전.
-- ══════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════
-- 1. 주문 확장 — 보류 반려 시각 (회원 예매 상세의 안내 문구에 쓴다)
-- ══════════════════════════════════════════════════════════════════════════

alter table ticket_orders add column if not exists hold_rejected_at timestamptz;

comment on column ticket_orders.hold_rejected_at is
  '운영자가 확인 보류를 반려해 입금 대기로 되돌린 시각 (회원 안내용)';

-- ══════════════════════════════════════════════════════════════════════════
-- 2. 운영자 액션 — 보류 반려
-- ══════════════════════════════════════════════════════════════════════════

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

  -- ② 이 예매에 묶여 보류된 입금은 반환 대상으로 넘긴다(예매 대금으로 인정하지 않는다).
  --    매칭 연결은 남겨 둔다 — 환불 계좌를 확인하려면 어느 예매의 입금이었는지 필요하다.
  with marked as (
    update ticket_deposits
       set status = 'REFUND_TARGET',
           memo   = v_refund_memo
     where matched_order_id = p_order_id
       and status = 'HELD'
    returning id
  )
  select count(*)::int into v_targets from marked;

  -- ① 예매를 입금 대기로 되돌린다. 환불 계좌·실제 입금자명은 환불 처리에 필요하므로 남긴다.
  update ticket_orders
     set status              = 'AWAITING_DEPOSIT',
         hold_reason         = null,
         deposit_reported_at = null,
         hold_rejected_at    = now(),
         deposit_deadline    = v_deadline
   where id = p_order_id;

  -- ③ 활동 로그
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

-- ══════════════════════════════════════════════════════════════════════════
-- 3. 회원 입금확인 요청 — 보류 반려 안내를 함께 내린다
--    회원이 재송금 후 다시 요청하면 지난 반려 안내는 더 이상 유효하지 않다.
--    (미입금 반려 안내와 같은 방식으로 요청 시점에 지운다)
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
         report_rejected_at  = null,
         hold_rejected_at    = null
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
