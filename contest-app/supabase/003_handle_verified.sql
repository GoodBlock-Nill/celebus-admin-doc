-- ============================================================
-- FanStage 003: 도용 방지 — 핸들 자동 인증
-- 출품 핸들을 유저 입력이 아니라 링크의 실제 작성자에서 추출해 강제 저장.
--   x·tiktok·threads = URL 내장 계정 / youtube = oEmbed 채널 핸들 → handle_verified = true
--   instagram = 자동 추출 불가 → 수동 입력 + handle_verified = false (관리자 확인 대상)
-- Supabase SQL Editor에서 실행.
-- ============================================================

alter table contest_entries add column if not exists handle_verified boolean not null default false;

-- 공개 뷰 재생성 (+ handle_verified — "계정 확인됨" 배지용)
drop view if exists contest_entries_public;
create view contest_entries_public as
  select e.id, e.contest_id, e.platform, e.source_url, e.external_id,
         e.title, e.description, e.handle, e.handle_verified, e.vote_count, e.disqualified,
         e.created_at, e.updated_at, (e.updated_at > e.created_at) as edited,
         e.oembed->>'thumbnail_url' as thumbnail_url,
         e.oembed->>'title'         as oembed_title,
         e.oembed->>'author_name'   as oembed_author
  from contest_entries e
  join contests c on c.id = e.contest_id and c.status <> 'draft'
  where e.hidden = false;
grant select on contest_entries_public to anon, authenticated;

-- contest_create_entry 재정의 (+ p_handle_verified). 시그니처 변경 → drop 후 재생성.
drop function if exists contest_create_entry(uuid,text,text,text,jsonb,text,text,text,text,text);
create or replace function contest_create_entry(
  p_contest_id uuid, p_platform text, p_source_url text, p_external_id text,
  p_oembed jsonb, p_title text, p_description text, p_handle text, p_handle_verified boolean,
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
  begin
    insert into contest_entries
      (contest_id, platform, source_url, external_id, oembed, title, description, handle, handle_verified, password_hash, author_hash)
    values
      (p_contest_id, p_platform, p_source_url, p_external_id, p_oembed, p_title, p_description, p_handle, p_handle_verified,
       crypt(p_password, gen_salt('bf')), p_author_hash)
    returning id into v_id;
  exception when unique_violation then
    return 'duplicate';
  end;
  return v_id::text;
end; $$;

-- 실행 권한 (신규 시그니처)
revoke execute on function contest_create_entry(uuid,text,text,text,jsonb,text,text,text,boolean,text,text) from public, anon, authenticated;
grant  execute on function contest_create_entry(uuid,text,text,text,jsonb,text,text,text,boolean,text,text) to service_role;
