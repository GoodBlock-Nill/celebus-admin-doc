-- ══════════════════════════════════════════════════════════════════════════
-- 예매 운영 예외 처리 3단계-A — 서버·로직 기반
-- 근거: [CEB-TKT-001-C] 예매 운영 예외 시나리오·플로우 재설계서 §6 Phase 3
--
-- ① E-5 환불 수수료 단계 계산·실환불액 기록
-- ② B-5 매칭 후보 다건 보호 (자동 매칭 금지 → 보류 후 수동 확인)
-- ③ B-6 분할 입금 — 복수 입금을 한 예매에 연결
-- ④ A-2 1인 한도 동시 경합 차단 (회원 행 잠금)
-- ⑤ A-7 진행 중 예매가 있는 회원의 실명 교체 차단
-- ⑥ A-10 같은 회차 중복 신청 멱등 처리
-- ⑦ F-3 재고 정합 점검 (읽기 전용)
-- ⑧ 회차 일괄 지급 (D-4 대비 기반)
--
-- ⚠️ 전이 표준 패턴(2단계에서 확립)을 신규·재정의 함수에 그대로 적용한다.
--      1. 대상 행을 먼저 잠근다            (select … for update)
--      2. 기대 상태를 조건에 넣어 바꾼다   (update … where 상태 = 기대값)
--      3. 바뀐 행이 0건이면 실패로 되돌린다 (get diagnostics 영향 행)
--    좌석 선점 반환·배정 수량 변경은 전이가 성공한 뒤에만 수행한다.
--    잠금 순서는 "예매 → 입금"으로 통일한다(교착 방지).
--
-- 멱등: add column if not exists / create or replace / drop if exists 기반 — 재실행 안전.
-- ══════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════
-- 1. 스키마 확장 — 환불 수수료·실환불액 기록 (E-5)
-- ══════════════════════════════════════════════════════════════════════════

alter table ticket_orders add column if not exists refund_fee_krw    integer;
alter table ticket_orders add column if not exists refund_amount_krw integer;

comment on column ticket_orders.refund_fee_krw is
  '환불 승인 시 확정된 환불 수수료(원). 승인 전에는 비어 있다.';
comment on column ticket_orders.refund_amount_krw is
  '환불 승인 시 회원에게 실제로 돌려준 금액(원) = 결제 금액 - 환불 수수료.';

-- ══════════════════════════════════════════════════════════════════════════
-- 2. E-5 — 환불 수수료 단계
--
--    기준: 공정거래위원회 소비자분쟁해결기준(공연업) 취소 시점별 단계.
--      · 예매 후 24시간 이내      → 수수료 없음 (청약 철회 성격, 다른 단계보다 우선)
--      · 관람일 10일 전 이전      → 수수료 없음
--      · 관람일 9일 전 ~ 7일 전   → 결제 금액의 10%
--      · 관람일 6일 전 ~ 3일 전   → 결제 금액의 20%
--      · 관람일 2일 전 ~ 1일 전   → 결제 금액의 30%
--      · 관람일 당일 이후          → 결제 금액의 90%
--    · 공연 취소로 생긴 환불은 사업자 귀책이므로 수수료 0을 강제한다.
--
--    단계표는 아래 상수 배열 한 곳에만 둔다. 공연별 정책이 필요해지면
--    이 배열을 공연 설정에서 읽어오도록 바꾸는 것만으로 확장할 수 있다.
--      각 행 = [적용 하한 일수, 수수료 비율(%)] — 위에서부터 처음 만족하는 행을 쓴다.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function ticket_refund_fee_quote(p_order ticket_orders)
returns jsonb
language plpgsql stable as $$
declare
  -- [관람일까지 남은 일수 하한, 수수료 비율(%)] — 마지막 행이 당일 이후를 받는다.
  v_tiers  constant integer[][] := array[[10, 0], [7, 10], [3, 20], [1, 30], [-999999, 90]];
  v_free_hours constant integer := 24;
  v_start  timestamptz;
  v_status text;
  v_days   integer;
  v_rate   integer := 0;
  v_basis  text;
  v_fee    integer;
  i        integer;
begin
  select c.status into v_status from ticket_concerts c where c.id = p_order.concert_id;

  -- 공연 취소 환불은 회원 잘못이 아니므로 수수료를 받지 않는다.
  if v_status = 'CANCELED' then
    return jsonb_build_object(
      'rate_percent', 0, 'fee_krw', 0, 'refund_krw', p_order.amount_krw,
      'basis', '공연 취소 — 수수료 없음');
  end if;

  -- 예매 직후 철회는 관람일과 무관하게 수수료를 받지 않는다.
  if now() < p_order.created_at + make_interval(hours => v_free_hours) then
    return jsonb_build_object(
      'rate_percent', 0, 'fee_krw', 0, 'refund_krw', p_order.amount_krw,
      'basis', '예매 후 24시간 이내 — 수수료 없음');
  end if;

  select s.start_at into v_start from ticket_concert_sessions s where s.id = p_order.session_id;
  v_days := ticket_kst_date(coalesce(v_start, now())) - ticket_kst_date(now());

  for i in 1..array_length(v_tiers, 1) loop
    if v_days >= v_tiers[i][1] then
      v_rate := v_tiers[i][2];
      exit;
    end if;
  end loop;

  v_basis := case
    when v_days >= 10 then '관람일 10일 전 이전 — 수수료 없음'
    when v_days >= 7  then '관람일 ' || v_days || '일 전 — 결제 금액의 10%'
    when v_days >= 3  then '관람일 ' || v_days || '일 전 — 결제 금액의 20%'
    when v_days >= 1  then '관람일 ' || v_days || '일 전 — 결제 금액의 30%'
    else '관람일 당일 이후 — 결제 금액의 90%'
  end;

  v_fee := floor(p_order.amount_krw::numeric * v_rate / 100)::integer;

  return jsonb_build_object(
    'rate_percent', v_rate,
    'fee_krw', v_fee,
    'refund_krw', p_order.amount_krw - v_fee,
    'days_before', v_days,
    'basis', v_basis
  );
end $$;

revoke execute on function ticket_refund_fee_quote(ticket_orders) from public, anon, authenticated;

-- 자동 계산 수수료 금액만 필요한 곳에서 쓰는 얇은 표기
create or replace function ticket_refund_fee_of(p_order ticket_orders)
returns integer language sql stable as $$
  select (ticket_refund_fee_quote(p_order) ->> 'fee_krw')::integer;
$$;

revoke execute on function ticket_refund_fee_of(ticket_orders) from public, anon, authenticated;

-- 관리자 화면이 승인 전에 보여 줄 자동 계산값 묶음 조회
create or replace function ticket_refund_fee_quotes(p_order_ids uuid[])
returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(
    jsonb_object_agg(o.id::text, ticket_refund_fee_quote(o)),
    '{}'::jsonb
  )
  from ticket_orders o
  where o.id = any(coalesce(p_order_ids, '{}'::uuid[]));
$$;

revoke execute on function ticket_refund_fee_quotes(uuid[]) from public, anon, authenticated;
grant  execute on function ticket_refund_fee_quotes(uuid[]) to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 3. E-5 — 환불 승인에 수수료·실환불액을 기록한다
--    · 수수료를 넘기지 않으면(비움) 위 단계표로 자동 계산한다.
--    · 운영자가 넘긴 조정값이 있으면 그 값을 우선한다(0 ~ 결제 금액).
--    · 공연 취소 환불은 어떤 값을 넘겨도 수수료 0을 강제한다.
--
--    기존 2개 인자 함수는 지운다(같은 이름에 기본값 인자를 더하면 호출이 모호해진다).
-- ══════════════════════════════════════════════════════════════════════════

drop function if exists ticket_approve_refund(uuid, text);

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
grant  execute on function ticket_approve_refund(uuid, text, integer) to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 4. A-2 / A-10 — 예매 신청
--
--    A-2 한도 경합: 회원 행을 먼저 잠가 같은 회원의 동시 신청을 한 줄로 세운다.
--        잠금이 없으면 두 요청이 같은 "보유 매수"를 읽어 한도를 넘겨 성립한다.
--    A-10 중복 신청: 같은 회차에 진행 중인 예매가 있으면 기본적으로 거부하고
--        기존 예매 정보를 함께 돌려준다. 화면은 이 정보로 안내 모달을 띄우고,
--        회원이 추가 예매를 선택하면 p_allow_additional 을 켜서 다시 신청한다.
--
--    기존 5개 인자 함수는 지운다(같은 이름에 기본값 인자를 더하면 호출이 모호해진다).
-- ══════════════════════════════════════════════════════════════════════════

drop function if exists ticket_create_order(uuid, uuid, integer, boolean, text);

create or replace function ticket_create_order(
  p_member_id           uuid,
  p_session_id          uuid,
  p_qty                 integer,
  p_wants_cash_receipt  boolean,
  p_cash_receipt_phone  text,
  p_allow_additional    boolean default false
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_now          timestamptz := now();
  v_verification ticket_identity_verifications;
  v_session      ticket_concert_sessions;
  v_concert      ticket_concerts;
  v_member       ticket_members;
  v_existing     ticket_orders;
  v_held         integer;
  v_rows         integer;
  v_add_days     integer;
  v_order_no     text;
  v_order        ticket_orders;
  v_phone        text;
begin
  -- 마감 경과 주문을 먼저 정리해 잔여 좌석·1인 한도 계산의 정합성을 맞춘다.
  perform ticket_expire_overdue_orders();

  -- A-2 — 회원 행 잠금. 이 잠금은 함수가 끝날 때까지 유지되므로
  --        "한도 검사 → 좌석 선점 → 주문 생성"이 회원 단위로 직렬화된다.
  select * into v_member from ticket_members where id = p_member_id for update;
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

  -- A-10 — 같은 회차에 아직 끝나지 않은 예매가 있는지 확인한다.
  if not coalesce(p_allow_additional, false) then
    select * into v_existing
      from ticket_orders
     where member_id = p_member_id
       and session_id = p_session_id
       and status in ('AWAITING_DEPOSIT', 'DEPOSIT_REPORTED', 'ON_HOLD')
     order by created_at desc
     limit 1;

    if found then
      return jsonb_build_object(
        'ok', false,
        'code', 'EXISTING_ORDER',
        'reason', '이미 진행 중인 예매가 있습니다.',
        'existing_order_id', v_existing.id,
        'existing_order_no', v_existing.order_no,
        'existing_status', v_existing.status,
        'existing_qty', v_existing.qty,
        'existing_amount_krw', v_existing.amount_krw,
        'existing_deposit_deadline', v_existing.deposit_deadline
      );
    end if;
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
      || case when coalesce(p_allow_additional, false) then ' (같은 회차 추가 예매)' else '' end
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

revoke execute on function ticket_create_order(uuid, uuid, integer, boolean, text, boolean)
  from public, anon, authenticated;
grant  execute on function ticket_create_order(uuid, uuid, integer, boolean, text, boolean)
  to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 5. A-7 — 진행 중인 예매가 있으면 본인확인 실명을 바꿀 수 없다
--
--    예매의 입금자명 규칙은 본인확인 실명으로 만들어진다. 실명이 바뀌면 기존 예매의
--    자동 대조가 영구히 실패하고, 티켓의 실명 확인 근거도 어긋난다.
--    같은 실명으로 다시 인증하는 것(수단 변경·재인증)은 그대로 허용한다.
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
declare
  v_current ticket_identity_verifications;
  v_active  boolean;
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

  select * into v_current from ticket_identity_verifications where member_id = p_member_id;

  if found and ticket_norm_name(v_current.real_name) <> ticket_norm_name(p_real_name) then
    v_active :=
      exists (
        select 1 from ticket_orders o
         where o.member_id = p_member_id
           and o.status in ('AWAITING_DEPOSIT', 'DEPOSIT_REPORTED', 'ON_HOLD', 'DEPOSIT_CONFIRMED')
      )
      or exists (
        select 1 from ticket_tickets t
         where t.member_id = p_member_id and t.status = 'VALID'
      );

    if v_active then
      return jsonb_build_object('ok', false, 'code', 'ACTIVE_ORDER',
        'reason', '진행 중인 예매가 있어 본인확인 정보를 변경할 수 없습니다. 고객센터로 문의해 주세요.');
    end if;
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

revoke execute on function ticket_verify_identity(uuid, text, text, text, text, text)
  from public, anon, authenticated;
grant  execute on function ticket_verify_identity(uuid, text, text, text, text, text)
  to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 6. B-5 — 완전히 같은 조건의 예매가 둘 이상이면 자동 매칭하지 않는다
--
--    동명이인·같은 금액 예매가 여러 건이면 어느 예매의 돈인지 기계가 알 수 없다.
--    지금까지는 가장 오래된 예매에 임의로 붙였고, 잘못 붙으면 남의 예매가 확정됐다.
--    이제 입금만 보류로 남기고(예매 상태는 건드리지 않는다) 운영자가 수동으로 잇는다.
--
--    대조 순서
--      ① 입금자명·금액 모두 일치하는 진행중 예매 1건            → 확인 대기
--      ①-b 위 후보가 2건 이상                                   → 보류 (예매 연결 없음)
--      ② 입금자명은 맞고 금액만 다른 진행중 예매                 → 보류 (사유 코드 AMOUNT)
--      ③ 금액만 맞고 입금자명이 다른 진행중 예매                 → 보류 (사유 코드 NAME)
--      ④ 금액이 같은 취소·만료 예매                              → 반환 대상 (예매 연결 유지)
--      ⑤ 후보 없음                                              → 미대조
-- ══════════════════════════════════════════════════════════════════════════

create or replace function ticket_register_deposit(
  p_depositor_name text,
  p_amount         integer
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_multi_memo constant text := '동일 조건 예매 다건 — 수동 확인 필요';
  v_name    text := btrim(coalesce(p_depositor_name, ''));
  v_order   ticket_orders;
  v_deposit ticket_deposits;
  v_status  text;
  v_matched uuid := null;
  v_hold    uuid := null;
  v_cause   text := null;
  v_memo    text := null;
  v_exact   integer := 0;
begin
  if v_name = '' then
    return jsonb_build_object('ok', false, 'reason', '입금자명을 입력해 주세요.');
  end if;
  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('ok', false, 'reason', '입금액을 확인해 주세요.');
  end if;

  -- 마감 경과 예매를 먼저 정리해야 "마감 이후 입금 = 반환 대상" 판정이 성립한다.
  perform ticket_expire_overdue_orders();

  -- ① 금액·입금자명 모두 일치하는 입금 대기·입금 확인중 예매가 몇 건인지 먼저 센다.
  select count(*)::int into v_exact
    from ticket_orders o
    join ticket_identity_verifications v on v.member_id = o.member_id
   where o.status in ('AWAITING_DEPOSIT', 'DEPOSIT_REPORTED')
     and o.amount_krw = p_amount
     and (
       ticket_norm_name(v_name) = ticket_norm_name(v.real_name)
       or ticket_norm_name(v_name) = ticket_norm_name(v.real_name) || right(o.order_no, 4)
     );

  if v_exact = 1 then
    select o.* into v_order
      from ticket_orders o
      join ticket_identity_verifications v on v.member_id = o.member_id
     where o.status in ('AWAITING_DEPOSIT', 'DEPOSIT_REPORTED')
       and o.amount_krw = p_amount
       and (
         ticket_norm_name(v_name) = ticket_norm_name(v.real_name)
         or ticket_norm_name(v_name) = ticket_norm_name(v.real_name) || right(o.order_no, 4)
       )
     limit 1;

    v_status  := 'AUTO_MATCHED';
    v_matched := v_order.id;

  elsif v_exact >= 2 then
    -- ①-b 후보 다건 — 예매를 고르지 않고 입금만 보류한다.
    --      예매 상태는 그대로 두어야 애먼 회원의 예매가 보류로 바뀌지 않는다.
    v_status := 'HELD';
    v_memo   := v_multi_memo;

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
     where id = v_hold
       and status in ('AWAITING_DEPOSIT', 'DEPOSIT_REPORTED');
  end if;

  perform ticket_log('시스템', '입금 자동 대조',
    v_name || ' · ' || ticket_krw(p_amount) || ' · 결과 ' || v_status
      || case when v_exact >= 2 then ' (동일 조건 예매 ' || v_exact || '건 — 자동 매칭 보류)' else '' end);

  return jsonb_build_object(
    'ok', true,
    'deposit_id', v_deposit.id,
    'status', v_deposit.status,
    'matched_order_id', v_deposit.matched_order_id,
    'hold_cause', v_cause,
    'exact_candidates', v_exact,
    'memo', v_deposit.memo
  );
end $$;

revoke execute on function ticket_register_deposit(text, integer) from public, anon, authenticated;
grant  execute on function ticket_register_deposit(text, integer) to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 7. B-6 — 수동 매칭을 "복수 입금 → 한 예매"까지 넓힌다
--
--    나눠 보낸 입금(예: 30,000원 + 25,000원)을 한 번에 한 예매로 잇는다.
--      · 두 건 이상을 함께 연결할 때는 합산액이 예매 금액과 같아야 한다.
--      · 한 건만 연결할 때는 기존과 같이 금액 검증 없이 운영자 판단을 따른다
--        (오입금 인정·동명이인 정정 등 금액이 다른 연결이 정당한 경우가 있다).
--      · 이전에 잘못 묶여 보류됐던 예매는 원래 상태로 되돌린다.
--
--    기존 단건 함수는 지운다(인자 형태가 달라 같은 이름으로 공존하면 호출이 모호해진다).
-- ══════════════════════════════════════════════════════════════════════════

drop function if exists ticket_manual_match(uuid, uuid, text);

create or replace function ticket_manual_match(
  p_deposit_ids uuid[],
  p_order_id    uuid,
  p_admin       text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_open      constant text[] := array['UNMATCHED', 'AUTO_MATCHED', 'HELD', 'REFUND_TARGET'];
  v_ids       uuid[];
  v_order     ticket_orders;
  v_count     integer;
  v_sum       integer;
  v_previous  uuid[];
  v_names     text;
  v_rows      integer;
  v_reason    text;
begin
  select array_agg(distinct id) into v_ids
    from unnest(coalesce(p_deposit_ids, '{}'::uuid[])) as id;

  if v_ids is null or array_length(v_ids, 1) is null then
    return jsonb_build_object('ok', false, 'reason', '연결할 입금을 선택해 주세요.');
  end if;

  select count(*)::int, coalesce(sum(amount_krw), 0)::int, array_agg(distinct matched_order_id)
    into v_count, v_sum, v_previous
    from ticket_deposits
   where id = any(v_ids);

  if v_count <> array_length(v_ids, 1) then
    return jsonb_build_object('ok', false, 'reason', '입금 내역을 찾을 수 없습니다.');
  end if;

  -- 잠금 순서 예매 → 입금. 관련 예매(새로 연결할 예매·이전에 묶였던 예매)를 식별자 순서로 잠근다.
  perform 1
    from ticket_orders
   where id = p_order_id or id = any(coalesce(v_previous, '{}'::uuid[]))
   order by id
   for update;

  select * into v_order from ticket_orders where id = p_order_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '주문을 찾을 수 없습니다.');
  end if;
  if v_order.status not in ('AWAITING_DEPOSIT', 'DEPOSIT_REPORTED', 'ON_HOLD') then
    return jsonb_build_object('ok', false, 'reason', '입금대기 또는 보류 상태의 주문만 매칭할 수 있습니다.');
  end if;

  -- 잠근 뒤 다시 읽어 최신 상태·금액으로 판단한다.
  select count(*)::int, coalesce(sum(amount_krw), 0)::int, string_agg(depositor_name, ', ' order by deposited_at)
    into v_count, v_sum, v_names
    from (
      select * from ticket_deposits where id = any(v_ids) order by id for update
    ) d;

  if exists (select 1 from ticket_deposits where id = any(v_ids) and not (status = any(v_open))) then
    return jsonb_build_object('ok', false, 'reason', '이미 처리된 입금입니다.');
  end if;

  if v_count >= 2 and v_sum <> v_order.amount_krw then
    return jsonb_build_object('ok', false, 'reason',
      '선택한 입금의 합계가 예매 금액과 다릅니다. (합계 ' || ticket_krw(v_sum)
        || ' / 예매 ' || ticket_krw(v_order.amount_krw) || ')');
  end if;

  update ticket_deposits
     set status = 'AUTO_MATCHED', matched_order_id = p_order_id
   where id = any(v_ids) and status = any(v_open);
  get diagnostics v_rows = row_count;

  if v_rows <> v_count then
    perform ticket_transition_failed(ticket_stale_state_reason());
  end if;

  update ticket_orders
     set status = case when deposit_reported_at is null then 'AWAITING_DEPOSIT' else 'DEPOSIT_REPORTED' end,
         hold_reason = null,
         hold_cause  = null
   where id = p_order_id
     and status in ('AWAITING_DEPOSIT', 'DEPOSIT_REPORTED', 'ON_HOLD');

  -- 이전에 잘못 연결돼 보류된 예매는 원래 상태로 되돌린다.
  update ticket_orders
     set status = case when deposit_reported_at is null then 'AWAITING_DEPOSIT' else 'DEPOSIT_REPORTED' end,
         hold_reason = null,
         hold_cause  = null
   where id = any(coalesce(v_previous, '{}'::uuid[]))
     and id <> p_order_id
     and status = 'ON_HOLD'
     and not exists (
       select 1 from ticket_deposits d
        where d.matched_order_id = ticket_orders.id
          and d.status = 'HELD'
          and not (d.id = any(v_ids))
     );

  perform ticket_log(p_admin, '입금 수동 매칭',
    v_names || ' 입금 ' || v_count || '건(' || ticket_krw(v_sum) || ')을 주문 '
      || v_order.order_no || '에 연결했습니다.'
      || case when v_count >= 2 then ' (분할 입금 합산)' else '' end);

  return jsonb_build_object('ok', true, 'matched_count', v_count, 'total_krw', v_sum);
exception when sqlstate 'TK001' then
  get stacked diagnostics v_reason = message_text;
  return jsonb_build_object('ok', false, 'reason', v_reason);
end $$;

revoke execute on function ticket_manual_match(uuid[], uuid, text) from public, anon, authenticated;
grant  execute on function ticket_manual_match(uuid[], uuid, text) to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 8. B-6 후속 — 입금 확정이 분할 입금을 함께 종결한다
--
--    나눠 들어온 입금은 개별 금액이 예매 금액과 다르다. 한 건만 확정하면
--    나머지 건이 확인 대기에 남아 종결할 손잡이가 사라진다(B-7과 같은 교착).
--    · 누른 입금 한 건만으로 예매 금액이 채워지면 그 건만 확정한다(기존 동작).
--    · 연결된 미종결 입금의 합계가 예매 금액과 같으면 전부 함께 확정한다(분할 입금).
--    · 그 밖의 경우(금액 불일치 인정 확정 등)는 누른 건만 확정한다.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function ticket_confirm_deposit(
  p_deposit_id uuid,
  p_admin      text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_deposit  ticket_deposits;
  v_order    ticket_orders;
  v_open_sum integer;
  v_split    boolean := false;
  v_count    integer := 1;
  v_rows     integer;
  v_reason   text;
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

  -- 이 예매에 묶인 미종결 입금 전체를 잠근 뒤 합계를 낸다.
  select coalesce(sum(amount_krw), 0)::int into v_open_sum
    from (
      select * from ticket_deposits
       where matched_order_id = v_order.id
         and status in ('AUTO_MATCHED', 'HELD')
       order by id
       for update
    ) d;

  select * into v_deposit from ticket_deposits where id = p_deposit_id;

  if v_deposit.status not in ('AUTO_MATCHED', 'HELD') then
    return jsonb_build_object('ok', false, 'reason', '대조 완료 또는 보류 상태의 입금만 확정할 수 있습니다.');
  end if;
  if v_deposit.matched_order_id <> v_order.id then
    return jsonb_build_object('ok', false, 'reason', ticket_stale_state_reason());
  end if;
  if v_order.status not in ('AWAITING_DEPOSIT', 'DEPOSIT_REPORTED', 'ON_HOLD') then
    return jsonb_build_object('ok', false, 'reason', '입금 확정이 가능한 주문 상태가 아닙니다.');
  end if;

  v_split := v_deposit.amount_krw <> v_order.amount_krw and v_open_sum = v_order.amount_krw;

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
  if v_split then
    update ticket_deposits
       set status = 'CONFIRMED'
     where matched_order_id = v_order.id and status in ('AUTO_MATCHED', 'HELD');
  else
    update ticket_deposits
       set status = 'CONFIRMED'
     where id = p_deposit_id and status in ('AUTO_MATCHED', 'HELD');
  end if;
  get diagnostics v_rows = row_count;
  v_count := v_rows;

  if v_rows = 0 then
    perform ticket_transition_failed(ticket_stale_state_reason());
  end if;

  perform ticket_log(p_admin, '입금 확정',
    '주문 ' || v_order.order_no || ' 입금 확정 · 티켓 지급 대기로 전환'
      || case when v_split then ' (분할 입금 ' || v_count || '건 합산 확정)' else '' end);

  return jsonb_build_object(
    'ok', true,
    'order_id', v_order.id,
    'order_no', v_order.order_no,
    'confirmed_count', v_count,
    'split', v_split
  );
exception when sqlstate 'TK001' then
  get stacked diagnostics v_reason = message_text;
  return jsonb_build_object('ok', false, 'reason', v_reason);
end $$;

revoke execute on function ticket_confirm_deposit(uuid, text) from public, anon, authenticated;
grant  execute on function ticket_confirm_deposit(uuid, text) to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 9. F-3 — 재고 정합 점검 (읽기 전용)
--
--    선점·발급 수치가 예매·티켓 실측과 어긋나는지 회차·분류별로 다시 계산해 비교한다.
--    하한 보정(greatest(...,0))이 오류를 흡수해 조용히 어긋나는 상황을 드러내는 것이 목적이라
--    이 함수는 어떤 값도 고치지 않는다.
--
--    선점(reserved) 기대값 — 유상 판매분만 해당
--      · 입금 대기·입금 확인중·확인 보류·입금 확인 예매의 매수 합
--      · 취소 요청 예매 중 티켓이 한 번도 발급되지 않은 건의 매수 합
--        (티켓이 발급된 뒤 취소 요청된 건은 발급분에서 이미 정리됐다)
--    발급(issued) 기대값 — 분류별 무효화되지 않은 티켓 매수
-- ══════════════════════════════════════════════════════════════════════════

create or replace function ticket_pool_integrity_check()
returns jsonb
language sql stable security definer set search_path = public as $$
  with expected as (
    select
      p.session_id,
      p.pool_type,
      p.reserved,
      p.issued,
      case when p.pool_type = 'PAID_SALE' then coalesce(r.qty, 0) else 0 end as expected_reserved,
      coalesce(t.cnt, 0) as expected_issued
    from ticket_session_pools p
    left join lateral (
      select sum(o.qty)::int as qty
        from ticket_orders o
       where o.session_id = p.session_id
         and (
           o.status in ('AWAITING_DEPOSIT', 'DEPOSIT_REPORTED', 'ON_HOLD', 'DEPOSIT_CONFIRMED')
           or (
             o.status = 'CANCEL_REQUESTED'
             and not exists (select 1 from ticket_tickets tk where tk.order_id = o.id)
           )
         )
    ) r on true
    left join lateral (
      select count(*)::int as cnt
        from ticket_tickets tk
       where tk.session_id = p.session_id
         and tk.pool_type = p.pool_type
         and tk.status <> 'REVOKED'
    ) t on true
  ),
  mismatched as (
    select e.*, s.name as session_name, c.title as concert_title
      from expected e
      join ticket_concert_sessions s on s.id = e.session_id
      join ticket_concerts c on c.id = s.concert_id
     where e.reserved <> e.expected_reserved or e.issued <> e.expected_issued
  )
  select jsonb_build_object(
    'ok', true,
    'checked_at', now(),
    'checked_count', (select count(*)::int from expected),
    'mismatch_count', (select count(*)::int from mismatched),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'session_id', m.session_id,
        'session_name', m.session_name,
        'concert_title', m.concert_title,
        'pool_type', m.pool_type,
        'pool_label', ticket_pool_label(m.pool_type),
        'reserved', m.reserved,
        'expected_reserved', m.expected_reserved,
        'issued', m.issued,
        'expected_issued', m.expected_issued
      ) order by m.concert_title, m.session_name, m.pool_type)
      from mismatched m
    ), '[]'::jsonb)
  );
$$;

revoke execute on function ticket_pool_integrity_check() from public, anon, authenticated;
grant  execute on function ticket_pool_integrity_check() to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 10. 회차 일괄 지급 — 공연 당일 지급 작업의 기반 (D-4)
--
--     해당 회차의 티켓 지급 대기 예매를 건별로 잠그고 지급한다.
--     지급 처리 자체는 기존 단건 지급 함수를 그대로 호출해 규칙이 갈라지지 않게 한다.
--     한 건이 실패해도 나머지는 계속 처리하고(부분 실패 허용), 건별 결과를 함께 돌려준다.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function ticket_issue_session_tickets(
  p_session_id uuid,
  p_admin      text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_session ticket_concert_sessions;
  v_order   ticket_orders;
  v_result  jsonb;
  v_items   jsonb := '[]'::jsonb;
  v_ok      integer := 0;
  v_failed  integer := 0;
  v_qty     integer := 0;
begin
  select * into v_session from ticket_concert_sessions where id = p_session_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '회차 정보를 찾을 수 없습니다.');
  end if;

  for v_order in
    select * from ticket_orders
     where session_id = p_session_id and status = 'DEPOSIT_CONFIRMED'
     order by deposit_confirmed_at asc, created_at asc
  loop
    begin
      v_result := ticket_issue_order_tickets(v_order.id, p_admin);
    exception when others then
      v_result := jsonb_build_object('ok', false, 'reason', '티켓 지급 중 오류가 발생했습니다.');
    end;

    if coalesce((v_result ->> 'ok')::boolean, false) then
      v_ok  := v_ok + 1;
      v_qty := v_qty + coalesce((v_result ->> 'issued_qty')::int, 0);
    else
      v_failed := v_failed + 1;
    end if;

    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'order_id', v_order.id,
      'order_no', v_order.order_no,
      'qty', v_order.qty,
      'ok', coalesce((v_result ->> 'ok')::boolean, false),
      'reason', v_result ->> 'reason'
    ));
  end loop;

  perform ticket_log(p_admin, '회차 일괄 지급',
    v_session.name || ' · 지급 ' || v_ok || '건(' || v_qty || '매) · 실패 ' || v_failed || '건');

  return jsonb_build_object(
    'ok', true,
    'session_id', p_session_id,
    'session_name', v_session.name,
    'issued_orders', v_ok,
    'issued_qty', v_qty,
    'failed_orders', v_failed,
    'results', v_items
  );
end $$;

revoke execute on function ticket_issue_session_tickets(uuid, text) from public, anon, authenticated;
grant  execute on function ticket_issue_session_tickets(uuid, text) to service_role;
