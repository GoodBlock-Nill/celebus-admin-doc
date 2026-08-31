-- ─────────────────────────────────────────────────────────────────────────────
-- CELEBUS 예매 웹 (ticket-app) — 공연 포스터 이미지 · 상세정보(공연 소개 + 상세 이미지)
--
-- ① 포스터 이미지: 3:4 세로형 대표 이미지. 앱 공연 목록 카드·공연 상세 상단에 노출한다.
--    신규 등록은 필수지만, 이미 등록된 공연은 값이 없으므로 컬럼은 값 없음을 허용한다.
-- ② 공연 소개: 이미지 안 정보의 접근성·검색을 보완하는 요약 텍스트(선택, 2,000자 이내).
-- ③ 상세 이미지: 세로로 이어 붙여 보여 주는 상세 안내 이미지 목록(선택, 최대 10장, 순서 유지).
-- ④ 이미지 보관함: 공개 읽기 버킷 ticket-images. 업로드는 관리자 화면 → 서버(service_role)만.
--
-- 재실행 안전(idempotent) — add column if not exists / drop view if exists + create /
-- on conflict do nothing / create or replace.
-- ─────────────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════════════════
-- 1. 컬럼 추가 — 포스터 · 공연 소개 · 상세 이미지 목록
-- ══════════════════════════════════════════════════════════════════════════
alter table ticket_concerts add column if not exists poster_url text;
alter table ticket_concerts add column if not exists description text;
alter table ticket_concerts add column if not exists detail_image_urls jsonb not null default '[]'::jsonb;

comment on column ticket_concerts.poster_url is
  '포스터 이미지 주소 — 3:4 세로형(권장 1080×1440). 기존 공연 호환을 위해 값 없음 허용';
comment on column ticket_concerts.description is
  '공연 소개 — 상세 이미지 안 정보를 보완하는 요약 텍스트 (선택 입력, 2,000자 이내)';
comment on column ticket_concerts.detail_image_urls is
  '상세 이미지 주소 목록 — 앱 공연 상세에서 배열 순서대로 세로 나열 (선택 입력, 최대 10장)';

-- ══════════════════════════════════════════════════════════════════════════
-- 2. 공개 뷰 재생성 — 포스터 · 공연 소개 · 상세 이미지를 앱에 노출한다
--    (익명 읽기가 허용되는 유일한 경로이므로 컬럼 추가 시 반드시 함께 갱신)
-- ══════════════════════════════════════════════════════════════════════════
drop view if exists ticket_public_concerts;

create view ticket_public_concerts as
select
  c.id, c.title, c.artist, c.venue, c.venue_address, c.venue_map_url,
  c.poster_url, c.description, c.detail_image_urls,
  c.price_krw, c.max_per_user,
  c.seat_type, c.status, c.refund_policy, c.notice,
  c.sales_start_at, c.sales_end_at
from ticket_concerts c;

grant select on ticket_public_concerts to anon, authenticated;

-- ══════════════════════════════════════════════════════════════════════════
-- 3. 이미지 보관함 — 공개 읽기 버킷
--    쓰기는 관리자 화면 → 서버(service_role) 경유로만 이뤄지므로 별도 쓰기 정책을 두지 않는다.
--    공개 버킷이라 읽기는 정책 없이도 공개 주소로 열린다.
-- ══════════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('ticket-images', 'ticket-images', true)
on conflict (id) do nothing;

-- ══════════════════════════════════════════════════════════════════════════
-- 4. 공연 등록 갱신 — 포스터 · 공연 소개 · 상세 이미지 수용
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
  v_max_image_url_length constant integer := 1000;
  v_max_description_length constant integer := 2000;
  v_max_detail_images constant integer := 10;

  v_title         text := btrim(coalesce(p_payload->>'title', ''));
  v_artist        text := btrim(coalesce(p_payload->>'artist', ''));
  v_venue         text := btrim(coalesce(p_payload->>'venue', ''));
  -- 선택 입력 — 빈 문자열은 미입력으로 보고 값 없음으로 저장한다.
  v_venue_address text := nullif(btrim(coalesce(p_payload->>'venue_address', '')), '');
  v_venue_map_url text := nullif(btrim(coalesce(p_payload->>'venue_map_url', '')), '');
  v_poster_url    text := nullif(btrim(coalesce(p_payload->>'poster_url', '')), '');
  v_description   text := nullif(btrim(coalesce(p_payload->>'description', '')), '');
  v_detail_images jsonb := coalesce(p_payload->'detail_image_urls', '[]'::jsonb);
  v_detail_image  jsonb;
  v_detail_url    text;
  v_detail_clean  jsonb := '[]'::jsonb;
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

  -- ② 포스터 · 공연 소개 · 상세 이미지 — 모두 값이 있을 때만 형식을 본다.
  --    (포스터 필수 여부는 등록 화면에서 다루고, 여기서는 저장 가능한 형태인지만 확인한다)
  if v_poster_url is not null and char_length(v_poster_url) > v_max_image_url_length then
    return jsonb_build_object('ok', false, 'reason', '포스터 이미지 정보를 확인해 주세요.');
  end if;
  if v_description is not null and char_length(v_description) > v_max_description_length then
    return jsonb_build_object('ok', false, 'reason', '공연 소개는 2,000자 이내로 입력해 주세요.');
  end if;
  if jsonb_typeof(v_detail_images) <> 'array' then
    return jsonb_build_object('ok', false, 'reason', '상세 이미지 정보를 확인해 주세요.');
  end if;
  if jsonb_array_length(v_detail_images) > v_max_detail_images then
    return jsonb_build_object('ok', false, 'reason',
      format('상세 이미지는 최대 %s장까지 등록할 수 있습니다.', v_max_detail_images));
  end if;
  for v_detail_image in select * from jsonb_array_elements(v_detail_images) loop
    if jsonb_typeof(v_detail_image) <> 'string' then
      return jsonb_build_object('ok', false, 'reason', '상세 이미지 정보를 확인해 주세요.');
    end if;
    v_detail_url := btrim(v_detail_image #>> '{}');
    if v_detail_url = '' or char_length(v_detail_url) > v_max_image_url_length then
      return jsonb_build_object('ok', false, 'reason', '상세 이미지 정보를 확인해 주세요.');
    end if;
    v_detail_clean := v_detail_clean || to_jsonb(v_detail_url);
  end loop;

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

  -- ③ 회차 검증 — 삽입 전에 전량 확인한다.
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

  -- ④ 삽입 — 공연은 '판매 예정'으로 만들고, 판매 시작은 별도 액션으로 처리한다.
  insert into ticket_concerts (
    title, artist, venue, venue_address, venue_map_url,
    poster_url, description, detail_image_urls,
    price_krw, max_per_user, seat_type, status,
    refund_policy, notice, sales_start_at, sales_end_at
  ) values (
    v_title, v_artist, v_venue, v_venue_address, v_venue_map_url,
    v_poster_url, v_description, v_detail_clean,
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
