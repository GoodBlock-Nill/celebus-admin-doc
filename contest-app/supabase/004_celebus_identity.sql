-- ============================================================
-- FanStage 004: 출품 시 CELEBUS 신원(닉네임·인증 전화번호) 수집 + 공식계정 활용 동의
--   celebus_nickname / phone = 서버 전용(공개 뷰 제외) — 본인 확인·보상 연락용
--   consent_official_use = 출품작의 V01D 공식계정 활용 동의 (필수)
-- Supabase SQL Editor에서 실행.
-- ============================================================

alter table contest_entries add column if not exists celebus_nickname text;
alter table contest_entries add column if not exists phone text;
alter table contest_entries add column if not exists consent_official_use boolean not null default false;

-- 공개 뷰는 명시 컬럼 select라 재생성 불필요 (celebus_nickname·phone 미노출 유지 확인됨)

-- contest_create_entry 재정의 (+ p_celebus_nickname, p_phone, p_consent_official). 시그니처 변경 → drop 후 재생성.
drop function if exists contest_create_entry(uuid,text,text,text,jsonb,text,text,text,boolean,text,text);
create or replace function contest_create_entry(
  p_contest_id uuid, p_platform text, p_source_url text, p_external_id text,
  p_oembed jsonb, p_title text, p_description text, p_handle text, p_handle_verified boolean,
  p_celebus_nickname text, p_phone text, p_consent_official boolean,
  p_password text, p_author_hash text
) returns text language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_status text; v_start timestamptz; v_end timestamptz;
begin
  select status, submit_start_at, submit_end_at into v_status, v_start, v_end
    from contests where id = p_contest_id;
  if v_status is null then return 'not_found'; end if;
  if v_status <> 'open'
     or (v_start is not null and now() < v_start)
     or (v_end is not null and now() > v_end) then
    return 'closed';
  end if;
  if p_consent_official is not true then return 'consent_required'; end if;
  begin
    insert into contest_entries
      (contest_id, platform, source_url, external_id, oembed, title, description, handle, handle_verified,
       celebus_nickname, phone, consent_official_use, password_hash, author_hash)
    values
      (p_contest_id, p_platform, p_source_url, p_external_id, p_oembed, p_title, p_description, p_handle, p_handle_verified,
       p_celebus_nickname, p_phone, true, crypt(p_password, gen_salt('bf')), p_author_hash)
    returning id into v_id;
  exception when unique_violation then
    return 'duplicate';
  end;
  return v_id::text;
end; $$;

-- 실행 권한 (신규 시그니처)
revoke execute on function contest_create_entry(uuid,text,text,text,jsonb,text,text,text,boolean,text,text,boolean,text,text) from public, anon, authenticated;
grant  execute on function contest_create_entry(uuid,text,text,text,jsonb,text,text,text,boolean,text,text,boolean,text,text) to service_role;

-- 관리자용: 개인정보(전화번호) 파기 — 콘테스트 종료 후 실행 권장
create or replace function contest_purge_entry_pii(p_contest_id uuid)
returns int language plpgsql security definer set search_path = public, extensions as $$
declare v_count int;
begin
  update contest_entries set phone = null
   where contest_id = p_contest_id and phone is not null;
  get diagnostics v_count = row_count;
  return v_count;
end; $$;
revoke execute on function contest_purge_entry_pii(uuid) from public, anon, authenticated;
grant  execute on function contest_purge_entry_pii(uuid) to service_role;
