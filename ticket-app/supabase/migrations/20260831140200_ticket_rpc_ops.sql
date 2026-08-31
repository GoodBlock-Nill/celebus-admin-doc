-- ─────────────────────────────────────────────────────────────────────────────
-- CELEBUS 예매 웹 (ticket-app) — 핵심 RPC ②: 입금 대조·티켓 지급·배정·체크인·신고
-- 설계서 [CEB-TKT-001-B] §5 (프로토 store-deposit / store-ticket / store-report 이식)
-- ─────────────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════════════════
-- 1. 입금 등록 + 자동 대조
--    · 금액 일치 + 입금자명 일치(실명 또는 실명+주문번호 끝 4자리) → 대조 완료
--    · 금액만 일치                                                  → 보류(주문도 보류)
--    · 후보 없음 + 동일 금액 만료 주문 존재                          → 반환 대상
--    · 그 외                                                        → 미대조
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

  -- ① 금액·입금자명 모두 일치하는 입금대기 주문
  select o.* into v_order
    from ticket_orders o
    join ticket_identity_verifications v on v.member_id = o.member_id
   where o.status = 'AWAITING_DEPOSIT'
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
    -- ② 금액만 일치하는 입금대기 주문 → 보류
    select o.* into v_order
      from ticket_orders o
     where o.status = 'AWAITING_DEPOSIT'
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

-- ══════════════════════════════════════════════════════════════════════════
-- 2. 운영자 액션 ① 입금 확정 — 주문을 "티켓 지급 대기"로 전환 (티켓 미발급, 선점 유지)
-- ══════════════════════════════════════════════════════════════════════════
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
  if v_order.status not in ('AWAITING_DEPOSIT', 'ON_HOLD') then
    return jsonb_build_object('ok', false, 'reason', '입금 확정이 가능한 주문 상태가 아닙니다.');
  end if;

  update ticket_deposits set status = 'CONFIRMED' where id = p_deposit_id;

  update ticket_orders
     set status = 'DEPOSIT_CONFIRMED',
         hold_reason = null,
         confirmed_deposit_id = p_deposit_id,
         deposit_confirmed_at = now()
   where id = v_order.id;

  perform ticket_log(p_admin, '입금 확정',
    '주문 ' || v_order.order_no || ' 입금 확정 · 티켓 지급 대기로 전환');

  return jsonb_build_object('ok', true, 'order_id', v_order.id, 'order_no', v_order.order_no);
end $$;

revoke execute on function ticket_confirm_deposit(uuid, text) from public, anon, authenticated;
grant  execute on function ticket_confirm_deposit(uuid, text) to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 3. 입금 보류 / 반환 대상 지정 / 반환 완료 / 수동 매칭
-- ══════════════════════════════════════════════════════════════════════════
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
     and status = 'AWAITING_DEPOSIT';

  perform ticket_log(p_admin, '입금 보류',
    v_deposit.depositor_name || ' · 사유 ' || coalesce(p_memo, ''));

  return jsonb_build_object('ok', true);
end $$;

revoke execute on function ticket_hold_deposit(uuid, text, text) from public, anon, authenticated;
grant  execute on function ticket_hold_deposit(uuid, text, text) to service_role;

create or replace function ticket_mark_refund_target(
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
    return jsonb_build_object('ok', false, 'reason', '이미 처리된 입금입니다.');
  end if;

  update ticket_deposits set status = 'REFUND_TARGET', memo = p_memo where id = p_deposit_id;

  perform ticket_log(p_admin, '반환 대상 지정',
    v_deposit.depositor_name || ' · 사유 ' || coalesce(p_memo, ''));

  return jsonb_build_object('ok', true);
end $$;

revoke execute on function ticket_mark_refund_target(uuid, text, text) from public, anon, authenticated;
grant  execute on function ticket_mark_refund_target(uuid, text, text) to service_role;

create or replace function ticket_refund_deposit(
  p_deposit_id uuid,
  p_admin      text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_deposit ticket_deposits;
begin
  select * into v_deposit from ticket_deposits where id = p_deposit_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '입금 내역을 찾을 수 없습니다.');
  end if;
  if v_deposit.status = 'REFUNDED' then
    return jsonb_build_object('ok', false, 'reason', '이미 반환된 입금입니다.');
  end if;

  update ticket_deposits set status = 'REFUNDED' where id = p_deposit_id;

  perform ticket_log(p_admin, '입금 반환',
    v_deposit.depositor_name || ' · ' || ticket_krw(v_deposit.amount_krw) || ' 반환 완료');

  return jsonb_build_object('ok', true);
end $$;

revoke execute on function ticket_refund_deposit(uuid, text) from public, anon, authenticated;
grant  execute on function ticket_refund_deposit(uuid, text) to service_role;

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
  if v_order.status not in ('AWAITING_DEPOSIT', 'ON_HOLD') then
    return jsonb_build_object('ok', false, 'reason', '입금대기 또는 보류 상태의 주문만 매칭할 수 있습니다.');
  end if;

  v_previous := v_deposit.matched_order_id;

  update ticket_deposits
     set status = 'AUTO_MATCHED', matched_order_id = p_order_id
   where id = p_deposit_id;

  update ticket_orders
     set status = 'AWAITING_DEPOSIT', hold_reason = null
   where id = p_order_id;

  -- 이전에 잘못 연결돼 보류된 주문은 입금대기로 되돌린다.
  if v_previous is not null and v_previous <> p_order_id then
    update ticket_orders
       set status = 'AWAITING_DEPOSIT', hold_reason = null
     where id = v_previous and status = 'ON_HOLD';
  end if;

  perform ticket_log(p_admin, '입금 수동 매칭',
    v_deposit.depositor_name || ' 입금을 주문 ' || v_order.order_no || '에 연결했습니다.');

  return jsonb_build_object('ok', true);
end $$;

revoke execute on function ticket_manual_match(uuid, uuid, text) from public, anon, authenticated;
grant  execute on function ticket_manual_match(uuid, uuid, text) to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 4. 운영자 액션 ② 티켓 지급 — 지급 대기 주문에만 허용, 선점 → 발급 전환
-- ══════════════════════════════════════════════════════════════════════════
create or replace function ticket_issue_order_tickets(
  p_order_id uuid,
  p_admin    text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order   ticket_orders;
  v_codes   text[] := '{}';
  v_code    text;
  v_attempt integer;
  i         integer;
begin
  select * into v_order from ticket_orders where id = p_order_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '주문을 찾을 수 없습니다.');
  end if;
  if v_order.status <> 'DEPOSIT_CONFIRMED' then
    return jsonb_build_object('ok', false, 'reason', '입금 확인이 끝난 지급 대기 주문만 티켓을 지급할 수 있습니다.');
  end if;

  for i in 1..v_order.qty loop
    v_attempt := 0;
    loop
      begin
        v_code := ticket_gen_code();
        insert into ticket_tickets (code, order_id, member_id, concert_id, session_id, pool_type, status)
        values (v_code, v_order.id, v_order.member_id, v_order.concert_id, v_order.session_id, 'PAID_SALE', 'VALID');
        exit;
      exception when unique_violation then
        v_attempt := v_attempt + 1;
        if v_attempt >= 20 then
          raise exception '체크인 코드 생성에 실패했습니다.';
        end if;
      end;
    end loop;
    v_codes := array_append(v_codes, v_code);
  end loop;

  update ticket_session_pools
     set reserved = greatest(reserved - v_order.qty, 0),
         issued   = issued + v_order.qty,
         updated_at = now()
   where session_id = v_order.session_id and pool_type = 'PAID_SALE';

  update ticket_orders set status = 'PAID' where id = v_order.id;

  perform ticket_log(p_admin, '티켓 지급',
    '주문 ' || v_order.order_no || ' · 실명 티켓 ' || v_order.qty || '매 지급 완료');

  return jsonb_build_object('ok', true, 'codes', to_jsonb(v_codes), 'issued_qty', v_order.qty);
end $$;

revoke execute on function ticket_issue_order_tickets(uuid, text) from public, anon, authenticated;
grant  execute on function ticket_issue_order_tickets(uuid, text) to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 5. 무상 티켓 발급 (당첨자·초대·운영 보류분) — 유상 판매 배정 풀은 사용 금지
-- ══════════════════════════════════════════════════════════════════════════
create or replace function ticket_issue_comp_tickets(
  p_session_id uuid,
  p_pool_type  text,
  p_member_id  uuid,
  p_qty        integer,
  p_reason     text,
  p_admin      text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_session ticket_concert_sessions;
  v_member  ticket_members;
  v_reason  text := btrim(coalesce(p_reason, ''));
  v_rows    integer;
  v_codes   text[] := '{}';
  v_code    text;
  v_attempt integer;
  i         integer;
begin
  if p_qty is null or p_qty < 1 then
    return jsonb_build_object('ok', false, 'reason', '발급 매수를 확인해 주세요.');
  end if;
  if p_pool_type is null or p_pool_type not in ('CELEBUS_WINNER', 'IX_INVITATION', 'OPERATION_HOLD') then
    return jsonb_build_object('ok', false, 'reason', '유상 판매 배정 풀은 무상 발급 대상이 아닙니다.');
  end if;

  select * into v_session from ticket_concert_sessions where id = p_session_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '회차 정보를 찾을 수 없습니다.');
  end if;

  select * into v_member from ticket_members where id = p_member_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '대상 회원을 찾을 수 없습니다.');
  end if;

  if p_pool_type = 'OPERATION_HOLD' and v_reason = '' then
    return jsonb_build_object('ok', false, 'reason', '운영 보류분 발급은 사유 입력이 필수입니다.');
  end if;

  -- 원자적 발급분 확보 — 잔여 부족이면 0행
  update ticket_session_pools
     set issued = issued + p_qty, updated_at = now()
   where session_id = p_session_id
     and pool_type = p_pool_type
     and allocated - reserved - issued >= p_qty;
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'reason',
      ticket_pool_label(p_pool_type) || ' 잔여 수량이 부족합니다.');
  end if;

  for i in 1..p_qty loop
    v_attempt := 0;
    loop
      begin
        v_code := ticket_gen_code();
        insert into ticket_tickets (code, order_id, member_id, concert_id, session_id, pool_type, status)
        values (v_code, null, p_member_id, v_session.concert_id, v_session.id, p_pool_type, 'VALID');
        exit;
      exception when unique_violation then
        v_attempt := v_attempt + 1;
        if v_attempt >= 20 then
          raise exception '체크인 코드 생성에 실패했습니다.';
        end if;
      end;
    end loop;
    v_codes := array_append(v_codes, v_code);
  end loop;

  perform ticket_log(p_admin, '무상 티켓 발급',
    v_session.name || ' · ' || ticket_pool_label(p_pool_type) || ' ' || p_qty || '매 → '
      || coalesce(nullif(v_member.nickname, ''), v_member.celebus_uid)
      || case when v_reason <> '' then ' · 사유 ' || v_reason else '' end);

  return jsonb_build_object('ok', true, 'codes', to_jsonb(v_codes));
end $$;

revoke execute on function ticket_issue_comp_tickets(uuid, text, uuid, integer, text, text) from public, anon, authenticated;
grant  execute on function ticket_issue_comp_tickets(uuid, text, uuid, integer, text, text) to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 6. 배정 수량 이동 — 잔여(선점·발급 제외) 범위 안에서만 허용
-- ══════════════════════════════════════════════════════════════════════════
create or replace function ticket_reallocate_pool(
  p_session_id uuid,
  p_from       text,
  p_to         text,
  p_qty        integer,
  p_admin      text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_session ticket_concert_sessions;
  v_rows    integer;
  v_valid   constant text[] := array['PAID_SALE', 'CELEBUS_WINNER', 'IX_INVITATION', 'OPERATION_HOLD'];
begin
  if p_from = p_to then
    return jsonb_build_object('ok', false, 'reason', '동일한 배정 풀로는 이동할 수 없습니다.');
  end if;
  if p_qty is null or p_qty < 1 then
    return jsonb_build_object('ok', false, 'reason', '이동 수량을 확인해 주세요.');
  end if;
  if not (p_from = any(v_valid)) or not (p_to = any(v_valid)) then
    return jsonb_build_object('ok', false, 'reason', '배정 풀 구분을 확인해 주세요.');
  end if;

  select * into v_session from ticket_concert_sessions where id = p_session_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '회차 정보를 찾을 수 없습니다.');
  end if;

  update ticket_session_pools
     set allocated = allocated - p_qty, updated_at = now()
   where session_id = p_session_id
     and pool_type = p_from
     and allocated - reserved - issued >= p_qty;
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'reason',
      ticket_pool_label(p_from) || ' 잔여 수량이 부족합니다.');
  end if;

  insert into ticket_session_pools (session_id, pool_type, allocated)
  values (p_session_id, p_to, p_qty)
  on conflict (session_id, pool_type) do update
    set allocated = ticket_session_pools.allocated + excluded.allocated,
        updated_at = now();

  perform ticket_log(p_admin, '배정 수량 이동',
    v_session.name || ' · ' || ticket_pool_label(p_from) || ' → '
      || ticket_pool_label(p_to) || ' ' || p_qty || '매');

  return jsonb_build_object('ok', true);
end $$;

revoke execute on function ticket_reallocate_pool(uuid, text, text, integer, text) from public, anon, authenticated;
grant  execute on function ticket_reallocate_pool(uuid, text, text, integer, text) to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 7. 현장 입장 확인 — 단일 UPDATE 원자 처리 (중복 스캔·무효 티켓 구분 응답)
-- ══════════════════════════════════════════════════════════════════════════
create or replace function ticket_check_in(p_code text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_code   text := upper(btrim(coalesce(p_code, '')));
  v_ticket ticket_tickets;
  v_json   jsonb;
begin
  if v_code = '' then
    return jsonb_build_object('kind', 'INVALID');
  end if;

  update ticket_tickets
     set status = 'USED', used_at = now()
   where code = v_code and status = 'VALID'
  returning * into v_ticket;

  if found then
    perform ticket_log('운영자', '입장 확인', '티켓 ' || v_ticket.code || ' 입장 처리');
    return jsonb_build_object('kind', 'OK', 'ticket', ticket_ticket_json(v_ticket));
  end if;

  select * into v_ticket from ticket_tickets where code = v_code;
  if not found then
    return jsonb_build_object('kind', 'INVALID');
  end if;

  v_json := ticket_ticket_json(v_ticket);
  if v_ticket.status = 'REVOKED' then
    return jsonb_build_object('kind', 'REVOKED', 'ticket', v_json);
  end if;

  return jsonb_build_object('kind', 'DUPLICATE', 'ticket', v_json);
end $$;

revoke execute on function ticket_check_in(text) from public, anon, authenticated;
grant  execute on function ticket_check_in(text) to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 8. 부정 거래 신고 접수 (처리 기한 10시간) · 조치 처리
-- ══════════════════════════════════════════════════════════════════════════
create or replace function ticket_submit_report(
  p_target_type  text,
  p_reason       text,
  p_detail       text,
  p_evidence_url text,
  p_source       text,
  p_member_id    uuid
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_report ticket_reports;
  v_member ticket_members;
  v_actor  text;
begin
  if p_target_type not in ('게시물', '계정', '외부 링크') then
    return jsonb_build_object('ok', false, 'reason', '신고 대상 구분을 확인해 주세요.');
  end if;
  if p_source not in ('앱 신고', '외부 통보') then
    return jsonb_build_object('ok', false, 'reason', '신고 경로를 확인해 주세요.');
  end if;
  if coalesce(btrim(p_reason), '') = '' then
    return jsonb_build_object('ok', false, 'reason', '신고 사유를 입력해 주세요.');
  end if;

  insert into ticket_reports (
    target_type, reason, detail, evidence_url, source, reporter_member_id, deadline_at, status
  ) values (
    p_target_type, btrim(p_reason), coalesce(p_detail, ''),
    nullif(btrim(coalesce(p_evidence_url, '')), ''), p_source, p_member_id,
    now() + interval '10 hours', 'RECEIVED'
  ) returning * into v_report;

  if p_source = '앱 신고' and p_member_id is not null then
    select * into v_member from ticket_members where id = p_member_id;
    v_actor := coalesce(nullif(v_member.nickname, ''), v_member.celebus_uid, '회원');
  else
    v_actor := '외부 통보';
  end if;

  perform ticket_log(v_actor, '부정 거래 신고 접수',
    v_report.target_type || ' · ' || v_report.reason || ' (처리 기한 10시간)');

  return jsonb_build_object('ok', true, 'report_id', v_report.id, 'deadline_at', v_report.deadline_at);
end $$;

revoke execute on function ticket_submit_report(text, text, text, text, text, uuid) from public, anon, authenticated;
grant  execute on function ticket_submit_report(text, text, text, text, text, uuid) to service_role;

create or replace function ticket_act_on_report(
  p_report_id uuid,
  p_action    text,
  p_admin     text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_report ticket_reports;
  v_next   text;
begin
  if p_action not in ('노출 차단', '수사기관 제출', '계정 제재', '티켓 무효화', '종결') then
    return jsonb_build_object('ok', false, 'reason', '지원하지 않는 조치입니다.');
  end if;

  select * into v_report from ticket_reports where id = p_report_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '신고 내역을 찾을 수 없습니다.');
  end if;
  if v_report.status = 'CLOSED' then
    return jsonb_build_object('ok', false, 'reason', '이미 종결된 신고입니다.');
  end if;

  -- 조치별 상태 전이 (계정 제재·티켓 무효화는 상태를 유지하고 이력만 남긴다)
  v_next := case p_action
    when '노출 차단'     then 'BLOCKED'
    when '수사기관 제출' then 'SUBMITTED'
    when '종결'          then 'CLOSED'
    else v_report.status
  end;

  update ticket_reports set status = v_next where id = p_report_id;

  insert into ticket_report_actions (report_id, action_type, admin_name)
  values (p_report_id, p_action, coalesce(nullif(btrim(p_admin), ''), '운영자'));

  perform ticket_log(p_admin, '신고 처리', v_report.reason || ' · ' || p_action);

  return jsonb_build_object('ok', true, 'status', v_next);
end $$;

revoke execute on function ticket_act_on_report(uuid, text, text) from public, anon, authenticated;
grant  execute on function ticket_act_on_report(uuid, text, text) to service_role;
