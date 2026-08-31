-- ─────────────────────────────────────────────────────────────────────────────
-- CELEBUS 예매 웹 (ticket-app) — 좌석 방식 '현장배정' 추가 + 공연장 주소·지도 링크
--
-- ① 좌석 방식: 스탠딩 공연처럼 입장 순서대로 자리를 잡는 운영 방식을 '현장배정'으로
--    등록할 수 있게 허용 목록을 넓힌다.
-- ② 공연장 주소·지도 링크: 앱 공연 상세에서 길찾기를 바로 열 수 있도록 두 항목을
--    선택 입력으로 저장한다(미입력 허용 — 기존 공연은 값 없음 그대로 유지).
--
-- 재실행 안전(idempotent) — drop if exists + add / add column if not exists / or replace.
-- ─────────────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════════════════
-- 1. 좌석 방식 허용 목록 교체 — 자유석 · 구역제 · 현장배정
-- ══════════════════════════════════════════════════════════════════════════
-- 기존 제약은 자동 이름(ticket_concerts_seat_type_check)으로 만들어졌지만, 이름이 달라도
-- 좌석 방식 값을 검사하는 제약이면 모두 걷어내고 새 목록으로 다시 만든다.
do $$
declare
  v_name text;
begin
  for v_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    where rel.relname = 'ticket_concerts'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) like '%자유석%'
  loop
    execute format('alter table ticket_concerts drop constraint %I', v_name);
  end loop;
end $$;

alter table ticket_concerts add constraint ticket_concerts_seat_type_check
  check (seat_type in ('자유석', '구역제', '현장배정'));

-- ══════════════════════════════════════════════════════════════════════════
-- 2. 공연장 주소 · 지도 링크 (둘 다 선택 입력)
-- ══════════════════════════════════════════════════════════════════════════
alter table ticket_concerts add column if not exists venue_address text;
alter table ticket_concerts add column if not exists venue_map_url text;

comment on column ticket_concerts.venue_address is '공연장 도로명 주소 (선택 입력)';
comment on column ticket_concerts.venue_map_url  is '지도 링크 — 앱 공연 상세의 "네이버지도 보기" 대상 (선택 입력)';

-- ══════════════════════════════════════════════════════════════════════════
-- 3. 공개 뷰 재생성 — 주소·지도 링크를 앱에 노출한다
--    (익명 읽기가 허용되는 유일한 경로이므로 컬럼 추가 시 반드시 함께 갱신)
-- ══════════════════════════════════════════════════════════════════════════
drop view if exists ticket_public_concerts;

create view ticket_public_concerts as
select
  c.id, c.title, c.artist, c.venue, c.venue_address, c.venue_map_url,
  c.price_krw, c.max_per_user,
  c.seat_type, c.status, c.refund_policy, c.notice,
  c.sales_start_at, c.sales_end_at
from ticket_concerts c;

grant select on ticket_public_concerts to anon, authenticated;

-- ══════════════════════════════════════════════════════════════════════════
-- 4. 공연 등록 RPC 갱신 — 좌석 방식 허용 목록 + 주소·지도 링크 수용
--    기존 검증·삽입 흐름은 그대로 두고 새 항목만 더한다.
-- ══════════════════════════════════════════════════════════════════════════
create or replace function ticket_create_concert(
  p_payload jsonb,
  p_admin   text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_pool_types constant text[] := array['PAID_SALE', 'CELEBUS_WINNER', 'IX_INVITATION', 'OPERATION_HOLD'];
  v_seat_types constant text[] := array['자유석', '구역제', '현장배정'];
  v_min_limit  constant integer := 1;
  v_max_limit  constant integer := 10;
  v_max_address_length constant integer := 200;
  v_max_map_url_length constant integer := 500;

  v_title         text := btrim(coalesce(p_payload->>'title', ''));
  v_artist        text := btrim(coalesce(p_payload->>'artist', ''));
  v_venue         text := btrim(coalesce(p_payload->>'venue', ''));
  -- 선택 입력 — 빈 문자열은 미입력으로 보고 값 없음으로 저장한다.
  v_venue_address text := nullif(btrim(coalesce(p_payload->>'venue_address', '')), '');
  v_venue_map_url text := nullif(btrim(coalesce(p_payload->>'venue_map_url', '')), '');
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
  if v_venue_address is not null and char_length(v_venue_address) > v_max_address_length then
    return jsonb_build_object('ok', false, 'reason',
      format('공연장 주소는 %s자 이내로 입력해 주세요.', v_max_address_length));
  end if;
  if v_venue_map_url is not null and char_length(v_venue_map_url) > v_max_map_url_length then
    return jsonb_build_object('ok', false, 'reason',
      format('지도 링크는 %s자 이내로 입력해 주세요.', v_max_map_url_length));
  end if;
  if not (v_seat_type = any (v_seat_types)) then
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
    title, artist, venue, venue_address, venue_map_url,
    price_krw, max_per_user, seat_type, status,
    refund_policy, notice, sales_start_at, sales_end_at
  ) values (
    v_title, v_artist, v_venue, v_venue_address, v_venue_map_url,
    v_price, v_max_per_user, v_seat_type, 'UPCOMING',
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
