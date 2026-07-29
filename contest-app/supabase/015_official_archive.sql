-- 015: 공식 아카이브(열람 전용) — 팬 업로드 아카이브 vs V01D 공식 영상 전용 아카이브 구분
-- stages.is_official=true → 팬 업로드 불가(열람 전용). 공식 클립만 들어감. status(open/archived)와 별개 축.
-- 팬 업로드 차단은 서버(stage_create_post RPC)에서 강제 — 클라 우회 방지.

alter table stages add column if not exists is_official boolean not null default false;

-- 공개 뷰에 is_official 노출 (기존 컬럼 순서 유지 + 맨 끝 추가)
create or replace view stages_public as
  select s.id, s.title, s.description, s.cover_url, s.event_date, s.status, s.post_count, s.sort_order, s.created_at,
         s.is_official
  from stages s
  where s.hidden = false;

-- 팬 업로드 RPC — 공식 아카이브면 거부(official_readonly). 나머지 로직 동일.
create or replace function stage_create_post(
  p_stage uuid, p_owner text, p_platform text, p_source_url text, p_external_id text,
  p_oembed jsonb, p_title text, p_description text, p_handle text, p_handle_verified boolean,
  p_category text
) returns text language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_recent int; v_status text; v_official boolean;
begin
  select status, is_official into v_status, v_official from stages where id = p_stage and hidden = false;
  if v_status is null then return 'not_found'; end if;
  if v_official then return 'official_readonly'; end if;     -- 공식 아카이브 = 열람 전용
  if v_status <> 'open' then return 'closed'; end if;
  select count(*) into v_recent from stage_posts
    where owner_id = p_owner and created_at > now() - interval '24 hours';
  if v_recent >= 10 then return 'rate_capped'; end if;
  if exists (select 1 from stage_posts where stage_id = p_stage and platform = p_platform and external_id = p_external_id) then
    return 'duplicate';
  end if;
  insert into stage_posts (stage_id, owner_id, platform, source_url, external_id, oembed, title, description, handle, handle_verified, category)
  values (p_stage, p_owner, p_platform, p_source_url, p_external_id, p_oembed, p_title, p_description, p_handle, p_handle_verified, p_category)
  returning id into v_id;
  update stages set post_count = post_count + 1, updated_at = now() where id = p_stage;
  return v_id::text;
end $$;
revoke execute on function stage_create_post(uuid,text,text,text,text,jsonb,text,text,text,boolean,text) from public, anon, authenticated;
grant  execute on function stage_create_post(uuid,text,text,text,text,jsonb,text,text,text,boolean,text) to service_role;
