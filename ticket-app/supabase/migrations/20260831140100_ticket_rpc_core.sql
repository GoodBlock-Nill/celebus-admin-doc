-- ─────────────────────────────────────────────────────────────────────────────
-- CELEBUS 예매 웹 (ticket-app) — 핵심 RPC ①: 로그인·본인확인·주문·만료·취소·환불
-- 설계서 [CEB-TKT-001-B] §5 핵심 서버 로직 (프로토 스토어 액션과 1:1 대응)
--
-- 전 함수 SECURITY DEFINER + public/anon/authenticated 실행 권한 회수.
-- 호출 경로는 서버(service_role)의 API Route뿐이다 — 브라우저 직접 호출 금지.
-- 실패 사유 문구는 프로토타입의 한국어 문구를 그대로 유지한다(화면 이식 시 동일 UX).
-- ─────────────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════════════════
-- 1. CELEBUS 계정 연계 로그인 — 회원 upsert
-- ══════════════════════════════════════════════════════════════════════════
create or replace function ticket_sso_login(
  p_celebus_uid text,
  p_member_hash text,
  p_nickname    text
) returns ticket_members
language plpgsql security definer set search_path = public as $$
declare v_member ticket_members;
begin
  insert into ticket_members (celebus_uid, member_hash, nickname)
  values (p_celebus_uid, p_member_hash, left(coalesce(p_nickname, ''), 60))
  on conflict (celebus_uid) do update
    set nickname      = excluded.nickname,
        member_hash   = excluded.member_hash,
        last_login_at = now()
  returning * into v_member;

  return v_member;
end $$;

revoke execute on function ticket_sso_login(text, text, text) from public, anon, authenticated;
grant  execute on function ticket_sso_login(text, text, text) to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 2. 본인확인 저장 — DI 중복 시 차단
-- ══════════════════════════════════════════════════════════════════════════
create or replace function ticket_verify_identity(
  p_member_id uuid,
  p_real_name text,
  p_birth     text,
  p_phone     text,
  p_di_hash   text,
  p_provider  text
) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from ticket_members where id = p_member_id) then
    return jsonb_build_object('ok', false, 'reason', '회원 정보를 찾을 수 없습니다.');
  end if;

  if coalesce(btrim(p_real_name), '') = '' or coalesce(btrim(p_di_hash), '') = '' then
    return jsonb_build_object('ok', false, 'reason', '본인확인 정보를 확인해 주세요.');
  end if;

  -- 다른 회원이 이미 사용한 인증 정보 → 중복 가입 차단
  if exists (
    select 1 from ticket_identity_verifications
    where di_hash = p_di_hash and member_id <> p_member_id
  ) then
    return jsonb_build_object('ok', false, 'reason', '중복');
  end if;

  insert into ticket_identity_verifications (member_id, real_name, birth, phone_enc, di_hash, provider)
  values (p_member_id, btrim(p_real_name), p_birth, p_phone, p_di_hash, p_provider)
  on conflict (member_id) do update
    set real_name   = excluded.real_name,
        birth       = excluded.birth,
        phone_enc   = excluded.phone_enc,
        di_hash     = excluded.di_hash,
        provider    = excluded.provider,
        verified_at = now();

  return jsonb_build_object('ok', true);
exception
  when unique_violation then
    -- di_hash UNIQUE 경합 (동시 요청) → 동일하게 중복 처리
    return jsonb_build_object('ok', false, 'reason', '중복');
end $$;

revoke execute on function ticket_verify_identity(uuid, text, text, text, text, text) from public, anon, authenticated;
grant  execute on function ticket_verify_identity(uuid, text, text, text, text, text) to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 3. 입금 마감 경과 주문 자동 취소 (lazy 정리 — 설계서 §5)
--    입금이 이미 확인된 주문(지급 대기)은 마감이 지나도 취소하지 않는다.
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

-- ══════════════════════════════════════════════════════════════════════════
-- 4. 예매 신청 — 검증 → 원자적 좌석 선점 → 주문 생성
--    ⚠️ 프로토 validateOrder의 검증 순서를 유지하되, 현금영수증 입력 검증만
--       좌석 선점보다 앞으로 옮겨 "선점 후 실패" 경로를 제거했다.
-- ══════════════════════════════════════════════════════════════════════════
create or replace function ticket_create_order(
  p_member_id           uuid,
  p_session_id          uuid,
  p_qty                 integer,
  p_wants_cash_receipt  boolean,
  p_cash_receipt_phone  text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_now          timestamptz := now();
  v_verification ticket_identity_verifications;
  v_session      ticket_concert_sessions;
  v_concert      ticket_concerts;
  v_member       ticket_members;
  v_held         integer;
  v_rows         integer;
  v_add_days     integer;
  v_order_no     text;
  v_order        ticket_orders;
  v_phone        text;
begin
  -- 마감 경과 주문을 먼저 정리해 잔여 좌석·1인 한도 계산의 정합성을 맞춘다.
  perform ticket_expire_overdue_orders();

  select * into v_member from ticket_members where id = p_member_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '회원 정보를 찾을 수 없습니다.');
  end if;

  select * into v_verification from ticket_identity_verifications where member_id = p_member_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '본인확인을 먼저 완료해 주세요.');
  end if;

  select * into v_session from ticket_concert_sessions where id = p_session_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '회차 정보를 찾을 수 없습니다.');
  end if;

  select * into v_concert from ticket_concerts where id = v_session.concert_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '공연 정보를 찾을 수 없습니다.');
  end if;

  if v_concert.status <> 'ON_SALE' then
    return jsonb_build_object('ok', false, 'reason', '현재 예매할 수 있는 공연이 아닙니다.');
  end if;
  if v_now < v_concert.sales_start_at then
    return jsonb_build_object('ok', false, 'reason', '아직 예매가 시작되지 않았습니다.');
  end if;
  if v_now > v_concert.sales_end_at then
    return jsonb_build_object('ok', false, 'reason', '예매가 마감되었습니다.');
  end if;

  if p_qty is null or p_qty < 1 then
    return jsonb_build_object('ok', false, 'reason', '예매 매수를 확인해 주세요.');
  end if;

  v_held := ticket_held_qty(p_member_id, v_concert.id);
  if v_held + p_qty > v_concert.max_per_user then
    return jsonb_build_object('ok', false, 'reason',
      format('1인 최대 %s매까지 예매할 수 있습니다. (현재 보유 %s매)', v_concert.max_per_user, v_held));
  end if;

  v_phone := nullif(btrim(coalesce(p_cash_receipt_phone, '')), '');
  if coalesce(p_wants_cash_receipt, false) and v_phone is null then
    return jsonb_build_object('ok', false, 'reason', '현금영수증 발급용 휴대폰번호를 입력해 주세요.');
  end if;

  -- 원자적 좌석 선점 — 검사와 증가를 단일 UPDATE로 처리해 오버셀을 차단한다.
  update ticket_session_pools
     set reserved = reserved + p_qty,
         updated_at = now()
   where session_id = p_session_id
     and pool_type = 'PAID_SALE'
     and allocated - reserved - issued >= p_qty;
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'reason', '잔여 좌석이 부족합니다.');
  end if;

  select case when deposit_deadline_mode = 'NEXT_DAY' then 1 else 0 end
    into v_add_days
    from ticket_app_settings where id = 'default';
  v_add_days := coalesce(v_add_days, 0);

  v_order_no := ticket_next_order_no(v_now);

  insert into ticket_orders (
    order_no, member_id, concert_id, session_id, qty, amount_krw, status,
    created_at, deposit_deadline, depositor_name_rule,
    wants_cash_receipt, cash_receipt_phone_enc
  ) values (
    v_order_no, p_member_id, v_concert.id, p_session_id, p_qty,
    v_concert.price_krw * p_qty, 'AWAITING_DEPOSIT',
    v_now, ticket_kst_end_of_day(v_now, v_add_days),
    ticket_depositor_name_rule(v_verification.real_name),
    coalesce(p_wants_cash_receipt, false),
    case when coalesce(p_wants_cash_receipt, false) then v_phone else null end
  ) returning * into v_order;

  perform ticket_log(
    coalesce(nullif(v_member.nickname, ''), v_member.celebus_uid),
    '예매 신청',
    '주문 ' || v_order.order_no || ' · ' || v_order.qty || '매 · '
      || ticket_krw(v_order.amount_krw) || ' 입금대기'
  );

  return jsonb_build_object(
    'ok', true,
    'order_id', v_order.id,
    'order_no', v_order.order_no,
    'qty', v_order.qty,
    'amount_krw', v_order.amount_krw,
    'status', v_order.status,
    'deposit_deadline', v_order.deposit_deadline,
    'depositor_name_rule', v_order.depositor_name_rule
  );
end $$;

revoke execute on function ticket_create_order(uuid, uuid, integer, boolean, text) from public, anon, authenticated;
grant  execute on function ticket_create_order(uuid, uuid, integer, boolean, text) to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 5. 취소 요청 — 입금 전이면 즉시 취소, 입금 후면 환불 요청 접수(24시간 SLA)
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

  select * into v_member from ticket_members where id = p_member_id;
  v_actor := coalesce(nullif(v_member.nickname, ''), v_member.celebus_uid, '회원');

  -- 입금대기·보류 주문은 즉시 취소하고 선점 좌석을 반환한다.
  if v_order.status in ('AWAITING_DEPOSIT', 'ON_HOLD') then
    update ticket_orders
       set status = 'EXPIRED', hold_reason = null
     where id = p_order_id;

    update ticket_session_pools
       set reserved = greatest(reserved - v_order.qty, 0), updated_at = now()
     where session_id = v_order.session_id and pool_type = 'PAID_SALE';

    perform ticket_log(v_actor, '사용자 취소',
      '주문 ' || v_order.order_no || '을(를) 입금 전에 취소했습니다.');

    return jsonb_build_object('ok', true, 'cancelled', true, 'status', 'EXPIRED');
  end if;

  -- 지급 대기 주문도 티켓 지급 완료 주문과 동일하게 취소 요청을 접수한다.
  if v_order.status not in ('PAID', 'DEPOSIT_CONFIRMED') then
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
-- 6. 환불 승인 — 티켓 발급 전이면 선점 반환, 발급 후면 티켓 무효화 + 발급분 반환
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
