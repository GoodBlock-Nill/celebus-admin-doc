-- ─────────────────────────────────────────────────────────────────────────────
-- CELEBUS 예매 웹 (ticket-app) — 공연 등록·판매 상태 전이 RPC
-- 설계서 [CEB-TKT-001-B] §4 (공연·회차·배정 풀 불변식)
--
-- 그동안 공연은 시드 SQL로만 만들 수 있었다. 운영자가 백오피스에서 직접
-- 공연·회차·4분류 배정을 등록하고 판매를 열고 닫을 수 있도록 두 개의 RPC를 추가한다.
-- 기존 RPC와 동일하게 SECURITY DEFINER + service_role 전용 + { ok, reason } 규약을 따른다.
--
-- 재실행 안전(idempotent) — create or replace 기반.
-- ─────────────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════════════════
-- 0. 공연 판매 상태 한국어 표기 (로그 문구 전용 — RPC 내부에서만 사용)
-- ══════════════════════════════════════════════════════════════════════════
create or replace function ticket_concert_status_label(p_status text)
returns text language sql immutable as $$
  select case p_status
    when 'UPCOMING' then '판매 예정'
    when 'ON_SALE'  then '판매 중'
    when 'CLOSED'   then '판매 종료'
    else p_status
  end;
$$;

revoke execute on function ticket_concert_status_label(text) from public, anon, authenticated;

-- ══════════════════════════════════════════════════════════════════════════
-- 1. 공연 등록 — 공연 1건 + 회차 N건 + 회차별 4분류 배정을 한 번에 생성
--    · 게시(판매 시작)는 별도 액션이므로 항상 '판매 예정'으로 만든다.
--    · 검증을 모두 마친 뒤에 삽입해 부분 생성이 남지 않도록 한다(단일 트랜잭션).
-- ══════════════════════════════════════════════════════════════════════════
create or replace function ticket_create_concert(
  p_payload jsonb,
  p_admin   text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_pool_types constant text[] := array['PAID_SALE', 'CELEBUS_WINNER', 'IX_INVITATION', 'OPERATION_HOLD'];
  v_min_limit  constant integer := 1;
  v_max_limit  constant integer := 10;

  v_title         text := btrim(coalesce(p_payload->>'title', ''));
  v_artist        text := btrim(coalesce(p_payload->>'artist', ''));
  v_venue         text := btrim(coalesce(p_payload->>'venue', ''));
  v_seat_type     text := coalesce(p_payload->>'seat_type', '자유석');
  v_refund_policy text := coalesce(p_payload->>'refund_policy', '');
  v_notice        text := coalesce(p_payload->>'notice', '');
  v_price         integer;
  v_max_per_user  integer;
  v_sales_start   timestamptz;
  v_sales_end     timestamptz;

  v_sessions      jsonb := coalesce(p_payload->'sessions', '[]'::jsonb);
  v_session       jsonb;
  v_session_name  text;
  v_session_start timestamptz;
  v_entry_minutes integer;
  v_pools         jsonb;
  v_pool_type     text;
  v_alloc         integer;

  v_concert_id    uuid;
  v_session_id    uuid;
  v_session_count integer;
  v_total_alloc   integer := 0;
begin
  -- ① 기본 정보 형식 — 숫자·일시 파싱 실패도 한국어 사유로 되돌린다.
  begin
    v_price        := (p_payload->>'price_krw')::integer;
    v_max_per_user := (p_payload->>'max_per_user')::integer;
    v_sales_start  := (p_payload->>'sales_start_at')::timestamptz;
    v_sales_end    := (p_payload->>'sales_end_at')::timestamptz;
  exception when others then
    return jsonb_build_object('ok', false, 'reason', '공연 기본 정보 형식을 확인해 주세요.');
  end;

  if v_title = '' then
    return jsonb_build_object('ok', false, 'reason', '공연 타이틀을 입력해 주세요.');
  end if;
  if v_artist = '' then
    return jsonb_build_object('ok', false, 'reason', '아티스트명을 입력해 주세요.');
  end if;
  if v_venue = '' then
    return jsonb_build_object('ok', false, 'reason', '공연장을 입력해 주세요.');
  end if;
  if v_seat_type not in ('자유석', '구역제') then
    return jsonb_build_object('ok', false, 'reason', '좌석 방식을 확인해 주세요.');
  end if;
  if v_price is null or v_price <= 0 then
    return jsonb_build_object('ok', false, 'reason', '티켓 가격은 1원 이상이어야 합니다.');
  end if;
  if v_max_per_user is null or v_max_per_user < v_min_limit or v_max_per_user > v_max_limit then
    return jsonb_build_object('ok', false, 'reason',
      format('1인 예매 한도는 %s~%s매 사이로 입력해 주세요.', v_min_limit, v_max_limit));
  end if;
  if v_sales_start is null or v_sales_end is null then
    return jsonb_build_object('ok', false, 'reason', '판매 시작·종료 일시를 모두 입력해 주세요.');
  end if;
  if v_sales_start >= v_sales_end then
    return jsonb_build_object('ok', false, 'reason', '판매 종료 일시는 시작 일시보다 뒤여야 합니다.');
  end if;

  -- ② 회차 검증 — 삽입 전에 전량 확인한다.
  if jsonb_typeof(v_sessions) <> 'array' or jsonb_array_length(v_sessions) = 0 then
    return jsonb_build_object('ok', false, 'reason', '회차를 1개 이상 등록해 주세요.');
  end if;
  v_session_count := jsonb_array_length(v_sessions);

  for v_session in select * from jsonb_array_elements(v_sessions) loop
    v_session_name := btrim(coalesce(v_session->>'name', ''));
    if v_session_name = '' then
      return jsonb_build_object('ok', false, 'reason', '회차 이름을 입력해 주세요.');
    end if;

    begin
      v_session_start := (v_session->>'start_at')::timestamptz;
      v_entry_minutes := coalesce((v_session->>'entry_open_minutes_before')::integer, 60);
    exception when others then
      return jsonb_build_object('ok', false, 'reason',
        '[' || v_session_name || '] 공연 일시·입장 기준 형식을 확인해 주세요.');
    end;

    if v_session_start is null then
      return jsonb_build_object('ok', false, 'reason',
        '[' || v_session_name || '] 공연 일시를 입력해 주세요.');
    end if;
    if v_entry_minutes < 0 then
      return jsonb_build_object('ok', false, 'reason',
        '[' || v_session_name || '] 입장 오픈 기준은 0분 이상이어야 합니다.');
    end if;

    v_pools := coalesce(v_session->'pools', '{}'::jsonb);
    foreach v_pool_type in array v_pool_types loop
      begin
        v_alloc := coalesce((v_pools->>v_pool_type)::integer, 0);
      exception when others then
        return jsonb_build_object('ok', false, 'reason',
          '[' || v_session_name || '] ' || ticket_pool_label(v_pool_type) || ' 배정 수량을 확인해 주세요.');
      end;

      if v_alloc < 0 then
        return jsonb_build_object('ok', false, 'reason',
          '[' || v_session_name || '] ' || ticket_pool_label(v_pool_type) || ' 배정 수량은 0 이상이어야 합니다.');
      end if;
      v_total_alloc := v_total_alloc + v_alloc;
    end loop;
  end loop;

  -- ③ 삽입 — 공연은 '판매 예정'으로 만들고, 판매 시작은 별도 액션으로 처리한다.
  insert into ticket_concerts (
    title, artist, venue, price_krw, max_per_user, seat_type, status,
    refund_policy, notice, sales_start_at, sales_end_at
  ) values (
    v_title, v_artist, v_venue, v_price, v_max_per_user, v_seat_type, 'UPCOMING',
    v_refund_policy, v_notice, v_sales_start, v_sales_end
  ) returning id into v_concert_id;

  for v_session in select * from jsonb_array_elements(v_sessions) loop
    insert into ticket_concert_sessions (concert_id, name, start_at, entry_open_minutes_before)
    values (
      v_concert_id,
      btrim(v_session->>'name'),
      (v_session->>'start_at')::timestamptz,
      coalesce((v_session->>'entry_open_minutes_before')::integer, 60)
    ) returning id into v_session_id;

    v_pools := coalesce(v_session->'pools', '{}'::jsonb);
    foreach v_pool_type in array v_pool_types loop
      insert into ticket_session_pools (session_id, pool_type, allocated)
      values (v_session_id, v_pool_type, coalesce((v_pools->>v_pool_type)::integer, 0))
      on conflict (session_id, pool_type) do update
        set allocated = excluded.allocated, updated_at = now();
    end loop;
  end loop;

  perform ticket_log(p_admin, '공연 등록',
    v_title || ' · ' || v_artist || ' · ' || ticket_krw(v_price)
      || ' · 회차 ' || v_session_count || '개 · 총 배정 ' || v_total_alloc || '매');

  return jsonb_build_object('ok', true, 'concert_id', v_concert_id);
end $$;

revoke execute on function ticket_create_concert(jsonb, text) from public, anon, authenticated;
grant  execute on function ticket_create_concert(jsonb, text) to service_role;

-- ══════════════════════════════════════════════════════════════════════════
-- 2. 판매 상태 전이 — 판매 예정 → 판매 중 → 판매 종료 (되돌리기 불가)
--    판매 예정 → 판매 종료(판매하지 않고 닫기)만 예외로 허용한다.
-- ══════════════════════════════════════════════════════════════════════════
create or replace function ticket_set_concert_status(
  p_concert_id uuid,
  p_status     text,
  p_admin      text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_concert ticket_concerts;
  v_allowed boolean;
begin
  if p_status is null or p_status not in ('ON_SALE', 'CLOSED') then
    return jsonb_build_object('ok', false, 'reason', '변경할 수 있는 판매 상태가 아닙니다.');
  end if;

  select * into v_concert from ticket_concerts where id = p_concert_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', '공연 정보를 찾을 수 없습니다.');
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

  update ticket_concerts set status = p_status where id = p_concert_id;

  perform ticket_log(p_admin, '공연 상태 변경',
    v_concert.title || ' · ' || ticket_concert_status_label(v_concert.status)
      || ' → ' || ticket_concert_status_label(p_status));

  return jsonb_build_object('ok', true, 'status', p_status);
end $$;

revoke execute on function ticket_set_concert_status(uuid, text, text) from public, anon, authenticated;
grant  execute on function ticket_set_concert_status(uuid, text, text) to service_role;
