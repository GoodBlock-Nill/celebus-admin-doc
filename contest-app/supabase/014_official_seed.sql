-- 014: 공식 콘텐츠 구분 + 시드 (CELEBUS MOMENT — 배포 초기 채우기)
-- V01D 공식 유튜브 클립을 배포 전 미리 채워 빈 화면 방지. 팬 업로드와 정직하게 구분(is_official + '공식' 배지).
-- 공식 시드는 owner_id='official'(가짜 팬 아님), handle_verified=true, 레이트캡 없음(관리자 시드).

alter table stage_posts add column if not exists is_official boolean not null default false;
create index if not exists idx_stage_posts_official on stage_posts (stage_id) where is_official;

-- 공개 뷰에 is_official 노출 (기존 컬럼 순서 유지 + 맨 끝 추가)
create or replace view stage_posts_public as
  select p.id, p.stage_id, p.platform, p.source_url, p.external_id, p.title, p.description,
         p.handle, p.handle_verified, p.category, p.like_count, p.created_at,
         (p.updated_at > p.created_at) as edited,
         p.oembed->>'thumbnail_url' as thumbnail_url,
         p.oembed->>'title'         as oembed_title,
         p.oembed->>'author_name'   as oembed_author,
         p.view_count, p.is_official
  from stage_posts p
  join stages s on s.id = p.stage_id and s.hidden = false
  where p.hidden = false;

-- 공식 시드 RPC — 레이트캡 없음, is_official=true, owner_id='official'(정직). 중복만 방지.
create or replace function stage_create_official(
  p_stage uuid, p_platform text, p_source_url text, p_external_id text,
  p_oembed jsonb, p_title text, p_description text, p_handle text, p_category text
) returns text language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_status text;
begin
  select status into v_status from stages where id = p_stage and hidden = false;
  if v_status is null then return 'not_found'; end if;
  if v_status <> 'open' then return 'closed'; end if;
  if exists (select 1 from stage_posts where stage_id = p_stage and platform = p_platform and external_id = p_external_id) then
    return 'duplicate';
  end if;
  insert into stage_posts (stage_id, owner_id, platform, source_url, external_id, oembed, title, description, handle, handle_verified, category, is_official)
  values (p_stage, 'official', p_platform, p_source_url, p_external_id, p_oembed, p_title, p_description, p_handle, true, p_category, true)
  returning id into v_id;
  update stages set post_count = post_count + 1, updated_at = now() where id = p_stage;
  return v_id::text;
end $$;
revoke execute on function stage_create_official(uuid,text,text,text,jsonb,text,text,text,text) from public, anon, authenticated;
grant  execute on function stage_create_official(uuid,text,text,text,jsonb,text,text,text,text) to service_role;

-- 챌린지 랭킹은 팬 콘텐츠만 — 공식 시드는 엔트리에서 제외(경쟁 대상 아님)
create or replace view challenge_standings_public as
  select e.id as event_id, p.id as post_id, p.title, p.handle,
         p.oembed->>'thumbnail_url' as thumbnail_url,
         coalesce(mh.cnt, 0) as member_hearts,
         p.like_count       as fan_hearts,
         p.view_count       as views,
         round((
           coalesce((e.rank_weights->>'member')::numeric, 3) * coalesce(mh.cnt, 0)
         + coalesce((e.rank_weights->>'fan')::numeric,    1) * p.like_count
         + coalesce((e.rank_weights->>'view')::numeric,   1) * ln(p.view_count + 1)::numeric
         )::numeric, 4) as score
  from stage_events e
  join stage_posts p
    on p.stage_id = e.stage_id and p.hidden = false and p.is_official = false
   and (e.submit_start_at is null or p.created_at >= e.submit_start_at)
   and (e.submit_end_at   is null or p.created_at <= e.submit_end_at)
  left join (select post_id, count(*) as cnt from member_hearts group by post_id) mh on mh.post_id = p.id
  where e.type = 'challenge' and e.status in ('open','announced');
grant select on challenge_standings_public to anon, authenticated;
