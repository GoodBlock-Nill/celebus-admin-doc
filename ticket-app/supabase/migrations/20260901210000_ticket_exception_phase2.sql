-- ══════════════════════════════════════════════════════════════════════════
-- 예매 운영 예외 처리 2단계 — 경합·정정 체계
-- 근거: [CEB-TKT-001-C] 예매 운영 예외 시나리오·플로우 재설계서 §3 원칙 ③ / §6 Phase 2
--
-- ① 전이 표준 패턴 전면 적용 (F-1 / F-2 / C-7 / D-2)
--    상태를 바꾸는 모든 처리는 아래 세 단계를 반드시 지킨다.
--      1. 대상 행을 먼저 잠근다            (select … for update)
--      2. 기대 상태를 조건에 넣어 바꾼다   (update … where 상태 = 기대값)
--      3. 바뀐 행이 0건이면 실패로 되돌린다 (get diagnostics 영향 행)
--    좌석 선점 반환·배정 수량 변경은 전이가 성공한 뒤에만 수행한다.
--    이 순서를 지켜야 같은 예매를 두 번 취소해 좌석이 두 번 반환되는(초과 판매) 일이 없다.
--
--    ⚠️ 잠금 순서는 "예매 → 입금"으로 통일한다. 두 대상을 함께 다루는 처리가
--       서로 반대 순서로 잠그면 교착이 생긴다.
--
-- ② 운영자 오처리 정정 (C-6)
--    잘못 누른 입금 확인·티켓 지급을 되돌리는 역방향 처리를 연다.
--    지금까지는 데이터를 직접 고치는 방법밖에 없었다.
--
-- ③ 취소 요청 반려 (E-1)
--    승인 한 갈래뿐이던 취소 요청에 "반려" 갈래를 더한다.
--
-- ④ 공연 취소 일괄 환불 (D-3)
--    공연이 취소되면 해당 공연의 모든 예매를 상태에 맞게 한 번에 정리한다.
--
-- ⑤ 입금 확인 요청 남용 제한 (B-11)
--    반려 ↔ 재요청을 무한히 반복해 좌석을 붙잡는 경로를 3회로 제한한다.
--
-- ⑥ 입금 오등록 정정 (B-13)
--    운영자가 잘못 등록한 입금을 사유와 함께 등록 취소할 수 있게 한다.
--
-- 멱등: add column if not exists / create or replace 기반 — 재실행 안전.
-- ══════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════
-- 1. 스키마 확장
-- ══════════════════════════════════════════════════════════════════════════

-- E-1 — 운영자가 취소 요청을 반려한 시각 (회원 안내 문구에 쓴다)
alter table ticket_orders add column if not exists cancel_rejected_at timestamptz;

comment on column ticket_orders.cancel_rejected_at is
  '운영자가 취소 요청을 반려해 원래 상태로 되돌린 시각 (회원 안내용)';

-- B-11 — 입금 확인 요청 누적 횟수 (요청 취소로는 줄지 않는다)
alter table ticket_orders add column if not exists deposit_report_count integer not null default 0;

comment on column ticket_orders.deposit_report_count is
  '입금 확인 요청 누적 횟수 — 3회까지 허용하고 4회째 요청은 거부한다 (요청 취소해도 줄지 않음)';

-- D-3 — 공연 취소 상태 추가
do $$
declare v_name text;
begin
  select conname into v_name
    from pg_constraint
   where conrelid = 'ticket_concerts'::regclass
     and contype = 'c'
     and pg_get_constraintdef(oid) like '%UPCOMING%';

  if v_name is not null then
    execute format('alter table ticket_concerts drop constraint %I', v_name);
  end if;
end $$;

alter table ticket_concerts
  add constraint ticket_concerts_status_check
  check (status in ('UPCOMING', 'ON_SALE', 'CLOSED', 'CANCELED'));

-- B-13 — 입금 등록 취소 상태 추가
do $$
declare v_name text;
begin
  select conname into v_name
    from pg_constraint
   where conrelid = 'ticket_deposits'::regclass
     and contype = 'c'
     and pg_get_constraintdef(oid) like '%UNMATCHED%';

  if v_name is not null then
    execute format('alter table ticket_deposits drop constraint %I', v_name);
  end if;
end $$;

alter table ticket_deposits
  add constraint ticket_deposits_status_check
  check (status in (
    'UNMATCHED', 'AUTO_MATCHED', 'CONFIRMED', 'HELD', 'REFUND_TARGET', 'REFUNDED', 'VOIDED'));

-- 공연 상태 한국어 표기 — 로그 문구 전용
create or replace function ticket_concert_status_label(p_status text)
returns text language sql immutable as $$
  select case p_status
    when 'UPCOMING' then '판매 예정'
    when 'ON_SALE'  then '판매 중'
    when 'CLOSED'   then '판매 종료'
    when 'CANCELED' then '공연 취소'
    else p_status
  end;
$$;

revoke execute on function ticket_concert_status_label(text) from public, anon, authenticated;

-- ══════════════════════════════════════════════════════════════════════════
-- 2. 전이 실패 신호
--    한 처리 안에서 여러 대상을 함께 바꿔야 할 때, 뒤 단계에서 조건이 어긋나면
--    앞서 바꾼 내용까지 전부 되돌려야 한다("입금만 확정되고 예매는 그대로" 방지).
--    이 신호를 올리면 함수 전체가 되돌아가고 실패 사유만 화면에 전달된다.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function ticket_transition_failed(p_reason text)
returns void language plpgsql as $$
begin
  raise exception using errcode = 'TK001', message = p_reason;
end $$;

revoke execute on function ticket_transition_failed(text) from public, anon, authenticated;

-- 상태가 어긋나 처리하지 못했을 때 공통으로 쓰는 안내 문구
create or replace function ticket_stale_state_reason()
returns text language sql immutable as $$
  select '처리하는 사이에 상태가 바뀌었습니다. 새로 고침 후 다시 확인해 주세요.';
$$;

revoke execute on function ticket_stale_state_reason() from public, anon, authenticated;

-- ══════════════════════════════════════════════════════════════════════════
-- 3. 회원 액션 — 전이 표준 패턴 적용
-- ══════════════════════════════════════════════════════════════════════════

-- 3-①. 예매 취소·취소 요청 (F-2 / D-2)
--   · 좌석 반환은 취소 전이가 성공한 뒤에만 수행한다 → 동시 취소로 인한 이중 반환 차단
--   · 티켓이 한 장이라도 살아 있으면 취소 요청을 받지 않는다 → 지급 직전 경합 차단
create or replace function ticket_request_cancel(
  p_order_id  uuid,
  p_member_id uuid
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order  ticket_orders;
  v_member ticket_members;
  v_actor  text;
  v_rows   integer;
  v_from   text;
begin
  -- ① 대상 잠금 — 잠근 뒤 읽은 값으로만 판단한다.
  select * into v_order
    from ticket_orders
   where id = p_order_id and member_id = p_member_id
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', '주문을 찾을 수 없습니다.');
  end if;

  -- 입금 확인중은 운영자 대조가 진행 중이므로 회원 취소를 막는다.
  if v_order.status = 'DEPOSIT_REPORTED' then
    return jsonb_build_object('ok', false,
      'reason', '입금 확인중에는 예매를 취소할 수 없습니다. 먼저 입금확인 요청을 취소해 주세요.');
  end if;

  -- 티켓이 지급된 예매는 취소·환불 요청 대상이 아니다.
  -- 상태와 함께 실제 티켓 존재까지 확인해 지급 직전 경합에서도 어긋나지 않게 한다.
  if v_order.status = 'PAID'
     or exists (
       select 1 from ticket_tickets
        where order_id = p_order_id and status <> 'REVOKED'
     ) then
    return jsonb_build_object('ok', false, 'reason', '티켓이 지급된 주문은 취소·환불 요청을 할 수 없습니다.');
  end if;

  select * into v_member from ticket_members where id = p_member_id;
  v_actor := coalesce(nullif(v_member.nickname, ''), v_member.celebus_uid, '회원');

  -- 입금대기·보류 예매는 즉시 취소하고 선점 좌석을 반환한다.
  if v_order.status in ('AWAITING_DEPOSIT', 'ON_HOLD') then
    v_from := v_order.status;

    update ticket_orders
       set status = 'EXPIRED',
           hold_reason = null,
           hold_cause = null,
           deposit_reported_at = null
     where id = p_order_id and status = v_from;
    get diagnostics v_rows = row_count;

    if v_rows = 0 then
      return jsonb_build_object('ok', false, 'reason', ticket_stale_state_reason());
    end if;

    -- ③ 좌석 반환은 전이 성공에 종속 — 두 번 취소돼도 좌석은 한 번만 돌아간다.
    update ticket_session_pools
       set reserved = greatest(reserved - v_order.qty, 0), updated_at = now()
     where session_id = v_order.session_id and pool_type = 'PAID_SALE';

    perform ticket_log(v_actor, '사용자 취소',
      '주문 ' || v_order.order_no || '을(를) 입금 전에 취소했습니다.');

    return jsonb_build_object('ok', true, 'cancelled', true, 'status', 'EXPIRED');
  end if;

  -- 입금 확인 예매만 취소 요청(24시간 이내 환불 처리)을 접수한다.
  if v_order.status <> 'DEPOSIT_CONFIRMED' then
    return jsonb_build_object('ok', false, 'reason', '취소할 수 있는 상태가 아닙니다.');
  end if;

  update ticket_orders
     set status = 'CANCEL_REQUESTED',
         cancel_requested_at = now(),
         cancel_rejected_at  = null
   where id = p_order_id and status = 'DEPOSIT_CONFIRMED';
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'reason', ticket_stale_state_reason());
  end if;

  perform ticket_log(v_actor, '취소 요청',
    '주문 ' || v_order.order_no || ' 취소를 요청했습니다. (24시간 이내 환불 처리)');

  return jsonb_build_object('ok', true, 'cancelled', false, 'status', 'CANCEL_REQUESTED');
end $$;

revoke execute on function ticket_request_cancel(uuid, uuid) from public, anon, authenticated;
grant  execute on function ticket_request_cancel(uuid, uuid) to service_role;

-- 3-②. 입금확인 요청 (B-11 요청 횟수 제한)
create or replace function ticket_report_deposit(
  p_order_id  uuid,
  p_member_id uuid
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  -- 반려 ↔ 재요청을 되풀이해 좌석을 붙잡는 경로를 막는 상한
  v_max_reports constant integer := 3;
  v_order  ticket_orders;
  v_member ticket_members;
  v_actor  text;
  v_rows   integer;
begin
  select * into v_order
    from ticket_orders
   where id = p_order_id and member_id = p_member_id
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', '주문을 찾을 수 없습니다.');
  end if;
  if v_order.status = 'DEPOSIT_REPORTED' then
    return jsonb_build_object('ok', false, 'reason', '이미 입금 확인을 요청했습니다.');
  end if;
  if v_order.status <> 'AWAITING_DEPOSIT' then
    return jsonb_build_object('ok', false, 'reason', '입금 대기 상태에서만 입금 확인을 요청할 수 있습니다.');
  end if;
  if coalesce(v_order.deposit_report_count, 0) >= v_max_reports then
    return jsonb_build_object('ok', false,
      'reason', '입금 확인 요청이 여러 차례 반려되었습니다. 고객센터로 문의해 주세요.');
  end if;

  update ticket_orders
     set status = 'DEPOSIT_REPORTED',
         deposit_reported_at  = now(),
         report_rejected_at   = null,
         hold_rejected_at     = null,
         deposit_report_count = coalesce(deposit_report_count, 0) + 1
   where id = p_order_id and status = 'AWAITING_DEPOSIT'
  returning * into v_order;
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'reason', ticket_stale_state_reason());
  end if;

  select * into v_member from ticket_members where id = p_member_id;
  v_actor := coalesce(nullif(v_member.nickname, ''), v_member.celebus_uid, '회원');

  perform ticket_log(v_actor, '입금 확인 요청',
    '주문 ' || v_order.order_no || ' · ' || ticket_krw(v_order.amount_krw)
      || ' 입금 확인을 요청했습니다. (' || v_order.deposit_report_count || '회차)');

  return jsonb_build_object(
    'ok', true,
    'status', v_order.status,
    'deposit_reported_at', v_order.deposit_reported_at,
    'deposit_report_count', v_order.deposit_report_count
  );
end $$;

revoke execute on function ticket_report_deposit(uuid, uuid) from public, anon, authenticated;
grant  execute on function ticket_report_deposit(uuid, uuid) to service_role;

-- 3-③. 입금확인 요청 취소 — 누적 요청 횟수는 그대로 유지한다.
create or replace function ticket_cancel_deposit_report(
  p_order_id  uuid,
  p_member_id uuid
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order  ticket_orders;
  v_member ticket_members;
  v_actor  text;
  v_rows   integer;
begin
  select * into v_order
    from ticket_orders
   where id = p_order_id and member_id = p_member_id
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', '주문을 찾을 수 없습니다.');
  end if;
  if v_order.status <> 'DEPOSIT_REPORTED' then
    return jsonb_build_object('ok', false, 'reason', '입금 확인 요청 상태의 주문만 취소할 수 있습니다.');
  end if;

  update ticket_orders
     set status = 'AWAITING_DEPOSIT',
         deposit_reported_at = null
   where id = p_order_id and status = 'DEPOSIT_REPORTED';
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'reason', ticket_stale_state_reason());
  end if;

  select * into v_member from ticket_members where id = p_member_id;
  v_actor := coalesce(nullif(v_member.nickname, ''), v_member.celebus_uid, '회원');

  perform ticket_log(v_actor, '입금 확인 요청 취소',
    '주문 ' || v_order.order_no || ' 입금 확인 요청을 취소했습니다.');

  return jsonb_build_object('ok', true, 'status', 'AWAITING_DEPOSIT');
end $$;

revoke execute on function ticket_cancel_deposit_report(uuid, uuid) from public, anon, authenticated;
grant  execute on function ticket_cancel_deposit_report(uuid, uuid) to service_role;

-- 3-④. 보류 해결 정보 제출 (C-5 허용 조건 유지 + 전이 표준 패턴)
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
  v_rows     integer;
begin
  if v_name is null and v_bank is null and v_account is null and v_holder is null then
    return jsonb_build_object('ok', false, 'reason', '알려주실 내용을 입력해 주세요.');
  end if;

  -- 환불 계좌는 은행·계좌번호·예금주가 한 묶음이어야 환불이 가능하다.
  if (v_bank is not null or v_account is not null or v_holder is not null)
     and (v_bank is null or v_account is null or v_holder is null) then
    return jsonb_build_object('ok', false, 'reason', '환불 계좌는 은행·계좌번호·예금주를 모두 입력해 주세요.');
  end if;

  select * into v_order
    from ticket_orders
   where id = p_order_id and member_id = p_member_id
   for update;

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
   where id = p_order_id and status = v_order.status
  returning * into v_order;
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'reason', ticket_stale_state_reason());
  end if;

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
-- 4. 운영자 입금 처리 — 전이 표준 패턴 적용
-- ══════════════════════════════════════════════════════════════════════════

-- 4-①. 미입금 반려
create or replace function ticket_reject_deposit_report(
  p_order_id uuid,
  p_admin    text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order ticket_orders;
  v_rows  integer;
begin
  select * into v_order from ticket_orders where id = p_order_id for update;
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
   where id = p_order_id and status = 'DEPOSIT_REPORTED';
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'reason', ticket_stale_state_reason());
  end if;

  perform ticket_log(p_admin, '입금 미확인 반려',
    '주문 ' || v_order.order_no || ' 입금이 확인되지 않아 입금 대기로 되돌렸습니다.');

  return jsonb_build_object('ok', true, 'order_no', v_order.order_no, 'status', 'AWAITING_DEPOSIT');
end $$;

revoke execute on function ticket_reject_deposit_report(uuid, text) from public, anon, authenticated;
grant  execute on function ticket_reject_deposit_report(uuid, text) to service_role;

-- 4-②. 입금 확정 (C-7 — 예매·입금 두 대상을 모두 잠그고 조건부로 바꾼다)
create or replace function ticket_confirm_deposit(
  p_deposit_id uuid,
  p_admin      text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_deposit ticket_deposits;
  v_order   ticket_orders;
  v_rows    integer;
  v_reason  text;
begin
  -- 잠금 순서를 "예매 → 입금"으로 맞추기 위해 연결된 예매를 먼저 찾는다.
  select * into v_deposit from ticket_deposits where id = p_deposit_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '입금 내역을 찾을 수 없습니다.');
  end if;
  if v_deposit.matched_order_id is null then
    return jsonb_build_object('ok', false, 'reason', '연결된 주문이 없습니다. 먼저 수동 매칭해 주세요.');
  end if;

  select * into v_order from ticket_orders where id = v_deposit.matched_order_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '연결된 주문이 없습니다. 먼저 수동 매칭해 주세요.');
  end if;

  -- 잠근 뒤 다시 읽어 최신 값으로 판단한다(잠금 전 값은 이미 낡았을 수 있다).
  select * into v_deposit from ticket_deposits where id = p_deposit_id for update;

  if v_deposit.status not in ('AUTO_MATCHED', 'HELD') then
    return jsonb_build_object('ok', false, 'reason', '대조 완료 또는 보류 상태의 입금만 확정할 수 있습니다.');
  end if;
  if v_deposit.matched_order_id <> v_order.id then
    return jsonb_build_object('ok', false, 'reason', ticket_stale_state_reason());
  end if;
  if v_order.status not in ('AWAITING_DEPOSIT', 'DEPOSIT_REPORTED', 'ON_HOLD') then
    return jsonb_build_object('ok', false, 'reason', '입금 확정이 가능한 주문 상태가 아닙니다.');
  end if;

  update ticket_orders
     set status = 'DEPOSIT_CONFIRMED',
         hold_reason = null,
         hold_cause = null,
         report_rejected_at = null,
         confirmed_deposit_id = p_deposit_id,
         deposit_confirmed_at = now()
   where id = v_order.id
     and status in ('AWAITING_DEPOSIT', 'DEPOSIT_REPORTED', 'ON_HOLD');
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'reason', ticket_stale_state_reason());
  end if;

  -- 입금 확정은 예매 전이가 성공한 뒤에만 기록한다(이중 수납이 장부에 숨지 않는다).
  update ticket_deposits
     set status = 'CONFIRMED'
   where id = p_deposit_id and status in ('AUTO_MATCHED', 'HELD');
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    perform ticket_transition_failed(ticket_stale_state_reason());
  end if;

  perform ticket_log(p_admin, '입금 확정',
    '주문 ' || v_order.order_no || ' 입금 확정 · 티켓 지급 대기로 전환');

  return jsonb_build_object('ok', true, 'order_id', v_order.id, 'order_no', v_order.order_no);
exception when sqlstate 'TK001' then
  get stacked diagnostics v_reason = message_text;
  return jsonb_build_object('ok', false, 'reason', v_reason);
end $$;

revoke execute on function ticket_confirm_deposit(uuid, text) from public, anon, authenticated;
grant  execute on function ticket_confirm_deposit(uuid, text) to service_role;

-- 4-③. 입금 보류
create or replace function ticket_hold_deposit(
  p_deposit_id uuid,
  p_memo       text,
  p_admin      text,
  p_cause      text default 'OTHER'
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_open   constant text[] := array['UNMATCHED', 'AUTO_MATCHED', 'HELD', 'REFUND_TARGET'];
  v_deposit ticket_deposits;
  v_order   ticket_orders;
  v_cause   text := coalesce(nullif(btrim(coalesce(p_cause, '')), ''), 'OTHER');
  v_rows    integer;
begin
  if v_cause not in ('NAME', 'AMOUNT', 'BOTH', 'OTHER') then
    return jsonb_build_object('ok', false, 'reason', '보류 사유 구분을 확인해 주세요.');
  end if;

  select * into v_deposit from ticket_deposits where id = p_deposit_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '입금 내역을 찾을 수 없습니다.');
  end if;

  -- 잠금 순서 예매 → 입금
  if v_deposit.matched_order_id is not null then
    select * into v_order from ticket_orders where id = v_deposit.matched_order_id for update;
  end if;
  select * into v_deposit from ticket_deposits where id = p_deposit_id for update;

  if not (v_deposit.status = any(v_open)) then
    return jsonb_build_object('ok', false, 'reason', '이미 처리된 입금은 보류할 수 없습니다.');
  end if;

  update ticket_deposits
     set status = 'HELD', memo = p_memo
   where id = p_deposit_id and status = any(v_open);
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'reason', ticket_stale_state_reason());
  end if;

  -- 연결된 예매도 보류로 옮긴다(이미 확정·취소된 예매는 그대로 둔다).
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

-- 4-④. 수동 매칭
create or replace function ticket_manual_match(
  p_deposit_id uuid,
  p_order_id   uuid,
  p_admin      text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_open   constant text[] := array['UNMATCHED', 'AUTO_MATCHED', 'HELD', 'REFUND_TARGET'];
  v_deposit  ticket_deposits;
  v_order    ticket_orders;
  v_previous uuid;
  v_rows     integer;
begin
  select * into v_deposit from ticket_deposits where id = p_deposit_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '입금 내역을 찾을 수 없습니다.');
  end if;

  v_previous := v_deposit.matched_order_id;

  -- 예매 두 건(새로 연결할 예매·이전에 묶였던 예매)을 식별자 순서로 잠가 교착을 피한다.
  perform 1
    from ticket_orders
   where id = p_order_id or (v_previous is not null and id = v_previous)
   order by id
   for update;

  select * into v_order from ticket_orders where id = p_order_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '주문을 찾을 수 없습니다.');
  end if;

  select * into v_deposit from ticket_deposits where id = p_deposit_id for update;
  if not (v_deposit.status = any(v_open)) then
    return jsonb_build_object('ok', false, 'reason', '이미 처리된 입금입니다.');
  end if;
  if v_order.status not in ('AWAITING_DEPOSIT', 'DEPOSIT_REPORTED', 'ON_HOLD') then
    return jsonb_build_object('ok', false, 'reason', '입금대기 또는 보류 상태의 주문만 매칭할 수 있습니다.');
  end if;

  update ticket_deposits
     set status = 'AUTO_MATCHED', matched_order_id = p_order_id
   where id = p_deposit_id and status = any(v_open);
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'reason', ticket_stale_state_reason());
  end if;

  update ticket_orders
     set status = case when deposit_reported_at is null then 'AWAITING_DEPOSIT' else 'DEPOSIT_REPORTED' end,
         hold_reason = null,
         hold_cause  = null
   where id = p_order_id
     and status in ('AWAITING_DEPOSIT', 'DEPOSIT_REPORTED', 'ON_HOLD');

  -- 이전에 잘못 연결돼 보류된 예매는 원래 상태로 되돌린다.
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

-- 4-⑤. 보류 반려
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
  v_rows     integer;
begin
  select * into v_order from ticket_orders where id = p_order_id for update;
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

  update ticket_orders
     set status              = 'AWAITING_DEPOSIT',
         hold_reason         = null,
         hold_cause          = null,
         deposit_reported_at = null,
         hold_rejected_at    = now(),
         deposit_deadline    = v_deadline
   where id = p_order_id and status = 'ON_HOLD';
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'reason', ticket_stale_state_reason());
  end if;

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

-- 4-⑥. 반환 대상 지정
create or replace function ticket_mark_refund_target(
  p_deposit_id uuid,
  p_memo       text,
  p_admin      text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_open   constant text[] := array['UNMATCHED', 'AUTO_MATCHED', 'HELD', 'REFUND_TARGET'];
  v_deposit ticket_deposits;
  v_rows    integer;
begin
  select * into v_deposit from ticket_deposits where id = p_deposit_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '입금 내역을 찾을 수 없습니다.');
  end if;
  if not (v_deposit.status = any(v_open)) then
    return jsonb_build_object('ok', false, 'reason', '이미 처리된 입금입니다.');
  end if;

  update ticket_deposits
     set status = 'REFUND_TARGET', memo = p_memo
   where id = p_deposit_id and status = any(v_open);
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'reason', ticket_stale_state_reason());
  end if;

  perform ticket_log(p_admin, '반환 대상 지정',
    v_deposit.depositor_name || ' · 사유 ' || coalesce(p_memo, ''));

  return jsonb_build_object('ok', true);
end $$;

revoke execute on function ticket_mark_refund_target(uuid, text, text) from public, anon, authenticated;
grant  execute on function ticket_mark_refund_target(uuid, text, text) to service_role;

-- 4-⑦. 반환 완료
create or replace function ticket_refund_deposit(
  p_deposit_id uuid,
  p_admin      text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_open   constant text[] := array['UNMATCHED', 'AUTO_MATCHED', 'CONFIRMED', 'HELD', 'REFUND_TARGET'];
  v_deposit ticket_deposits;
  v_rows    integer;
begin
  select * into v_deposit from ticket_deposits where id = p_deposit_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '입금 내역을 찾을 수 없습니다.');
  end if;
  if v_deposit.status = 'REFUNDED' then
    return jsonb_build_object('ok', false, 'reason', '이미 반환된 입금입니다.');
  end if;
  if v_deposit.status = 'VOIDED' then
    return jsonb_build_object('ok', false, 'reason', '등록이 취소된 입금은 반환할 수 없습니다.');
  end if;

  update ticket_deposits
     set status = 'REFUNDED'
   where id = p_deposit_id and status = any(v_open);
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'reason', ticket_stale_state_reason());
  end if;

  perform ticket_log(p_admin, '입금 반환',
    v_deposit.depositor_name || ' · ' || ticket_krw(v_deposit.amount_krw) || ' 반환 완료');

  return jsonb_build_object('ok', true);
end $$;

revoke execute on function ticket_refund_deposit(uuid, text) from public, anon, authenticated;
grant  execute on function ticket_refund_deposit(uuid, text) to service_role;

-- 4-⑧. 환불 승인 (F-2 — 티켓 회수·좌석 반환은 전이 성공에 종속)
create or replace function ticket_approve_refund(
  p_order_id uuid,
  p_admin    text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order     ticket_orders;
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

  update ticket_orders
     set status = 'REFUNDED', refunded_at = now()
   where id = p_order_id and status = 'CANCEL_REQUESTED';
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'reason', ticket_stale_state_reason());
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

  if v_order.confirmed_deposit_id is not null then
    update ticket_deposits
       set status = 'REFUNDED'
     where id = v_order.confirmed_deposit_id and status = 'CONFIRMED';
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

-- ══════════════════════════════════════════════════════════════════════════
-- 5. C-6 운영자 오처리 정정 — 역방향 처리 2종
--    되돌리는 처리는 되돌린 사실이 남아야 하므로 활동 로그를 반드시 기록한다.
-- ══════════════════════════════════════════════════════════════════════════

-- 5-①. 입금 확인 취소 — 티켓 지급 대기 예매를 입금 대기로 되돌린다.
create or replace function ticket_undo_confirm_deposit(
  p_order_id uuid,
  p_admin    text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order    ticket_orders;
  v_deadline timestamptz;
  v_rows     integer;
begin
  select * into v_order from ticket_orders where id = p_order_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '주문을 찾을 수 없습니다.');
  end if;
  if v_order.status <> 'DEPOSIT_CONFIRMED' then
    return jsonb_build_object('ok', false,
      'reason', '티켓 지급을 기다리는 주문만 입금 확인을 취소할 수 있습니다.');
  end if;
  if exists (
    select 1 from ticket_tickets where order_id = p_order_id and status <> 'REVOKED'
  ) then
    return jsonb_build_object('ok', false,
      'reason', '이미 티켓이 지급된 주문입니다. 티켓 지급 취소를 먼저 처리해 주세요.');
  end if;

  -- 마감이 지난 뒤 되돌리면 곧바로 자동 취소되므로 당일 자정까지 연장한다(보류 반려와 같은 기준).
  v_deadline := case
    when v_order.deposit_deadline < now() then ticket_kst_end_of_day(now())
    else v_order.deposit_deadline
  end;

  update ticket_orders
     set status               = 'AWAITING_DEPOSIT',
         confirmed_deposit_id = null,
         deposit_confirmed_at = null,
         deposit_reported_at  = null,
         deposit_deadline     = v_deadline
   where id = p_order_id and status = 'DEPOSIT_CONFIRMED';
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'reason', ticket_stale_state_reason());
  end if;

  -- 확정으로 기록됐던 입금은 확인 대기(자동 대조 완료)로 되돌린다.
  if v_order.confirmed_deposit_id is not null then
    update ticket_deposits
       set status = 'AUTO_MATCHED'
     where id = v_order.confirmed_deposit_id and status = 'CONFIRMED';
  end if;

  perform ticket_log(p_admin, '입금 확인 취소',
    '주문 ' || v_order.order_no || ' 입금 확인을 취소했습니다. (입금 대기로 되돌림)');

  return jsonb_build_object(
    'ok', true,
    'order_no', v_order.order_no,
    'status', 'AWAITING_DEPOSIT',
    'deposit_deadline', v_deadline
  );
end $$;

revoke execute on function ticket_undo_confirm_deposit(uuid, text) from public, anon, authenticated;
grant  execute on function ticket_undo_confirm_deposit(uuid, text) to service_role;

-- 5-②. 티켓 지급 취소 — 발급한 티켓을 회수하고 지급 대기로 되돌린다.
--      한 장이라도 입장에 사용됐다면 되돌릴 수 없다(현장 입장 기록이 사실과 어긋난다).
create or replace function ticket_undo_issue_tickets(
  p_order_id uuid,
  p_admin    text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order   ticket_orders;
  v_revoked integer := 0;
  v_rows    integer;
begin
  select * into v_order from ticket_orders where id = p_order_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '주문을 찾을 수 없습니다.');
  end if;
  if v_order.status <> 'PAID' then
    return jsonb_build_object('ok', false, 'reason', '티켓이 지급된 주문만 지급을 취소할 수 있습니다.');
  end if;
  if exists (
    select 1 from ticket_tickets where order_id = p_order_id and status = 'USED'
  ) then
    return jsonb_build_object('ok', false,
      'reason', '이미 입장에 사용된 티켓이 있어 지급을 취소할 수 없습니다.');
  end if;

  update ticket_orders
     set status = 'DEPOSIT_CONFIRMED'
   where id = p_order_id and status = 'PAID';
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'reason', ticket_stale_state_reason());
  end if;

  with revoked as (
    update ticket_tickets
       set status = 'REVOKED'
     where order_id = p_order_id and status = 'VALID'
    returning id
  )
  select count(*)::int into v_revoked from revoked;

  -- 회수한 매수만큼 발급분을 선점으로 되돌린다(총 좌석 수는 변하지 않는다).
  update ticket_session_pools
     set issued   = greatest(issued - v_revoked, 0),
         reserved = reserved + v_revoked,
         updated_at = now()
   where session_id = v_order.session_id and pool_type = 'PAID_SALE';

  perform ticket_log(p_admin, '티켓 지급 취소',
    '주문 ' || v_order.order_no || ' 티켓 지급을 취소했습니다. (티켓 ' || v_revoked
      || '매 회수 · 좌석 선점 복원)');

  return jsonb_build_object(
    'ok', true,
    'order_no', v_order.order_no,
    'status', 'DEPOSIT_CONFIRMED',
    'revoked_tickets', v_revoked
  );
end $$;

revoke execute on function ticket_undo_issue_tickets(uuid, text) from public, anon, authenticated;
grant  execute on function ticket_undo_issue_tickets(uuid, text) to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 6. E-1 취소 요청 반려
--    되돌릴 상태는 입금 확인 이력으로 가른다.
--      · 입금 확인을 거친 예매  → 입금 확인(티켓 지급 대기)
--      · 그 밖의 예매           → 입금 대기 (마감이 지났으면 당일 자정까지 연장)
-- ══════════════════════════════════════════════════════════════════════════

create or replace function ticket_reject_cancel_request(
  p_order_id uuid,
  p_admin    text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order    ticket_orders;
  v_concert  ticket_concerts;
  v_next     text;
  v_deadline timestamptz;
  v_rows     integer;
begin
  select * into v_order from ticket_orders where id = p_order_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '주문을 찾을 수 없습니다.');
  end if;
  if v_order.status <> 'CANCEL_REQUESTED' then
    return jsonb_build_object('ok', false, 'reason', '취소 요청된 주문만 반려할 수 있습니다.');
  end if;

  -- 공연 취소로 만들어진 환불 대상은 반려할 수 없다(환불이 법정 의무다).
  select * into v_concert from ticket_concerts where id = v_order.concert_id;
  if found and v_concert.status = 'CANCELED' then
    return jsonb_build_object('ok', false,
      'reason', '공연이 취소된 예매의 취소 요청은 반려할 수 없습니다.');
  end if;

  v_next := case when v_order.deposit_confirmed_at is not null
    then 'DEPOSIT_CONFIRMED' else 'AWAITING_DEPOSIT' end;

  v_deadline := case
    when v_next = 'AWAITING_DEPOSIT' and v_order.deposit_deadline < now()
      then ticket_kst_end_of_day(now())
    else v_order.deposit_deadline
  end;

  update ticket_orders
     set status              = v_next,
         cancel_requested_at = null,
         cancel_rejected_at  = now(),
         deposit_deadline    = v_deadline
   where id = p_order_id and status = 'CANCEL_REQUESTED';
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'reason', ticket_stale_state_reason());
  end if;

  perform ticket_log(p_admin, '취소 요청 반려',
    '주문 ' || v_order.order_no || ' 취소 요청을 반려했습니다. (되돌린 상태: '
      || case when v_next = 'DEPOSIT_CONFIRMED' then '입금 확인' else '입금 대기' end || ')');

  return jsonb_build_object('ok', true, 'order_no', v_order.order_no, 'status', v_next);
end $$;

revoke execute on function ticket_reject_cancel_request(uuid, text) from public, anon, authenticated;
grant  execute on function ticket_reject_cancel_request(uuid, text) to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 7. D-3 공연 취소 일괄 환불
--
--    예매 상태별 처리
--      · 티켓 지급          → 미사용 티켓 전량 회수 + 발급분 반환 → 취소 요청(환불 대상)
--      · 입금 확인·확인 보류 → 취소 요청(환불 대상). 선점 좌석은 환불 승인 때 반환한다.
--      · 연결 입금이 있는 입금 대기·입금 확인중 → 취소 요청(환불 대상)
--      · 입금이 없는 입금 대기·입금 확인중       → 자동 취소 + 선점 좌석 반환
--
--    예매 건별로 잠그고 기대 상태를 조건에 넣어 바꾼다(전이 표준 패턴).
--    개별 로그 대신 처리 결과를 요약한 로그 1건을 남긴다.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function ticket_cancel_concert(
  p_concert_id uuid,
  p_admin      text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_concert      ticket_concerts;
  v_order        ticket_orders;
  v_has_deposit  boolean;
  v_rows         integer;
  v_revoked      integer;
  v_refund_count integer := 0;
  v_expired      integer := 0;
  v_revoked_sum  integer := 0;
begin
  select * into v_concert from ticket_concerts where id = p_concert_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '공연 정보를 찾을 수 없습니다.');
  end if;
  if v_concert.status = 'CANCELED' then
    return jsonb_build_object('ok', false, 'reason', '이미 취소된 공연입니다.');
  end if;

  update ticket_concerts
     set status = 'CANCELED'
   where id = p_concert_id and status <> 'CANCELED';
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'reason', ticket_stale_state_reason());
  end if;

  for v_order in
    select o.*
      from ticket_orders o
     where o.concert_id = p_concert_id
       and o.status in ('AWAITING_DEPOSIT', 'DEPOSIT_REPORTED', 'ON_HOLD', 'DEPOSIT_CONFIRMED', 'PAID')
     order by o.id
     for update
  loop
    v_has_deposit := exists (
      select 1 from ticket_deposits d
       where d.matched_order_id = v_order.id
         and d.status in ('AUTO_MATCHED', 'HELD', 'CONFIRMED')
    );

    if v_order.status = 'PAID' then
      update ticket_orders
         set status = 'CANCEL_REQUESTED',
             cancel_requested_at = now(),
             cancel_rejected_at  = null
       where id = v_order.id and status = 'PAID';
      get diagnostics v_rows = row_count;

      if v_rows = 1 then
        with revoked as (
          update ticket_tickets
             set status = 'REVOKED'
           where order_id = v_order.id and status = 'VALID'
          returning id
        )
        select count(*)::int into v_revoked from revoked;

        update ticket_session_pools
           set issued = greatest(issued - v_revoked, 0), updated_at = now()
         where session_id = v_order.session_id and pool_type = 'PAID_SALE';

        v_refund_count := v_refund_count + 1;
        v_revoked_sum  := v_revoked_sum + v_revoked;
      end if;

    elsif v_order.status in ('DEPOSIT_CONFIRMED', 'ON_HOLD') or v_has_deposit then
      -- 돌려줄 돈이 있는 예매 — 환불 흐름으로 넘긴다(선점 좌석은 환불 승인 때 반환).
      update ticket_orders
         set status = 'CANCEL_REQUESTED',
             cancel_requested_at = now(),
             cancel_rejected_at  = null,
             hold_reason = null,
             hold_cause  = null
       where id = v_order.id and status = v_order.status;
      get diagnostics v_rows = row_count;

      if v_rows = 1 then
        v_refund_count := v_refund_count + 1;
      end if;

    else
      -- 입금이 없는 예매 — 곧바로 취소하고 선점 좌석을 반환한다.
      update ticket_orders
         set status = 'EXPIRED',
             hold_reason = null,
             hold_cause  = null,
             deposit_reported_at = null
       where id = v_order.id and status = v_order.status;
      get diagnostics v_rows = row_count;

      if v_rows = 1 then
        update ticket_session_pools
           set reserved = greatest(reserved - v_order.qty, 0), updated_at = now()
         where session_id = v_order.session_id and pool_type = 'PAID_SALE';

        v_expired := v_expired + 1;
      end if;
    end if;
  end loop;

  perform ticket_log(p_admin, '공연 취소',
    v_concert.title || ' 공연을 취소했습니다. (환불 대상 ' || v_refund_count || '건 · 자동 취소 '
      || v_expired || '건 · 티켓 회수 ' || v_revoked_sum || '매)');

  return jsonb_build_object(
    'ok', true,
    'title', v_concert.title,
    'refund_requested', v_refund_count,
    'expired', v_expired,
    'revoked_tickets', v_revoked_sum
  );
end $$;

revoke execute on function ticket_cancel_concert(uuid, text) from public, anon, authenticated;
grant  execute on function ticket_cancel_concert(uuid, text) to service_role;

-- 판매 상태 전이 — 취소된 공연은 판매 상태를 다시 바꿀 수 없다.
create or replace function ticket_set_concert_status(
  p_concert_id uuid,
  p_status     text,
  p_admin      text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_concert ticket_concerts;
  v_allowed boolean;
  v_rows    integer;
begin
  if p_status is null or p_status not in ('ON_SALE', 'CLOSED') then
    return jsonb_build_object('ok', false, 'reason', '변경할 수 있는 판매 상태가 아닙니다.');
  end if;

  select * into v_concert from ticket_concerts where id = p_concert_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '공연 정보를 찾을 수 없습니다.');
  end if;

  if v_concert.status = 'CANCELED' then
    return jsonb_build_object('ok', false, 'reason', '취소된 공연은 판매 상태를 변경할 수 없습니다.');
  end if;
  if v_concert.status = p_status then
    return jsonb_build_object('ok', false, 'reason',
      '이미 ' || ticket_concert_status_label(p_status) || ' 상태입니다.');
  end if;

  v_allowed :=
    (v_concert.status = 'UPCOMING' and p_status in ('ON_SALE', 'CLOSED'))
    or (v_concert.status = 'ON_SALE' and p_status = 'CLOSED');

  if not v_allowed then
    return jsonb_build_object('ok', false, 'reason',
      ticket_concert_status_label(v_concert.status) || ' 상태에서는 '
        || ticket_concert_status_label(p_status) || '(으)로 변경할 수 없습니다.');
  end if;

  update ticket_concerts
     set status = p_status
   where id = p_concert_id and status = v_concert.status;
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'reason', ticket_stale_state_reason());
  end if;

  perform ticket_log(p_admin, '공연 상태 변경',
    v_concert.title || ' · ' || ticket_concert_status_label(v_concert.status)
      || ' → ' || ticket_concert_status_label(p_status));

  return jsonb_build_object('ok', true, 'status', p_status);
end $$;

revoke execute on function ticket_set_concert_status(uuid, text, text) from public, anon, authenticated;
grant  execute on function ticket_set_concert_status(uuid, text, text) to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 8. B-13 입금 오등록 정정 — 등록 취소
--    · 확인 대기·보류·주문 미상 입금만 취소할 수 있다.
--    · 입금 확인이 끝난 입금은 먼저 입금 확인을 취소해야 한다(수납 기록이 어긋나지 않게).
--    · 취소한 입금이 그 예매의 유일한 보류 원인이었다면 보류도 함께 푼다.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function ticket_void_deposit(
  p_deposit_id uuid,
  p_admin      text,
  p_reason     text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_open   constant text[] := array['UNMATCHED', 'AUTO_MATCHED', 'HELD'];
  v_deposit  ticket_deposits;
  v_order    ticket_orders;
  v_reason   text := btrim(coalesce(p_reason, ''));
  v_was_held boolean;
  v_deadline timestamptz;
  v_released boolean := false;
  v_rows     integer;
begin
  if v_reason = '' then
    return jsonb_build_object('ok', false, 'reason', '등록 취소 사유를 입력해 주세요.');
  end if;

  select * into v_deposit from ticket_deposits where id = p_deposit_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '입금 내역을 찾을 수 없습니다.');
  end if;

  -- 잠금 순서 예매 → 입금
  if v_deposit.matched_order_id is not null then
    select * into v_order from ticket_orders where id = v_deposit.matched_order_id for update;
  end if;
  select * into v_deposit from ticket_deposits where id = p_deposit_id for update;

  if v_deposit.status = 'CONFIRMED' then
    return jsonb_build_object('ok', false,
      'reason', '입금 확인이 끝난 입금입니다. 먼저 입금 확인을 취소한 뒤 등록을 취소해 주세요.');
  end if;
  if not (v_deposit.status = any(v_open)) then
    return jsonb_build_object('ok', false,
      'reason', '확인 대기·보류·주문 미상 입금만 등록을 취소할 수 있습니다.');
  end if;

  v_was_held := v_deposit.status = 'HELD';

  update ticket_deposits
     set status = 'VOIDED',
         memo   = '등록 취소 — ' || v_reason
   where id = p_deposit_id and status = any(v_open);
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'reason', ticket_stale_state_reason());
  end if;

  -- 이 입금 때문에 보류됐던 예매는 남은 보류 입금이 없을 때만 보류를 푼다.
  if v_was_held and v_order.id is not null and v_order.status = 'ON_HOLD'
     and not exists (
       select 1 from ticket_deposits d
        where d.matched_order_id = v_order.id and d.status = 'HELD'
     ) then
    -- 되돌리자마자 자동 취소되지 않도록 지난 마감은 당일 자정까지 연장한다.
    v_deadline := case
      when v_order.deposit_deadline < now() then ticket_kst_end_of_day(now())
      else v_order.deposit_deadline
    end;

    update ticket_orders
       set status = case when deposit_reported_at is null then 'AWAITING_DEPOSIT' else 'DEPOSIT_REPORTED' end,
           hold_reason = null,
           hold_cause  = null,
           deposit_deadline = v_deadline
     where id = v_order.id and status = 'ON_HOLD';
    get diagnostics v_rows = row_count;
    v_released := v_rows = 1;
  end if;

  perform ticket_log(p_admin, '입금 등록 취소',
    v_deposit.depositor_name || ' · ' || ticket_krw(v_deposit.amount_krw) || ' 입금 등록을 취소했습니다. (사유 '
      || v_reason || case when v_released then ' · 예매 보류 해제' else '' end || ')');

  return jsonb_build_object('ok', true, 'hold_released', v_released);
end $$;

revoke execute on function ticket_void_deposit(uuid, text, text) from public, anon, authenticated;
grant  execute on function ticket_void_deposit(uuid, text, text) to service_role;
