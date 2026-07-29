-- 016: 홈 대표 영상 수동 고정 — 관리자가 특정 영상을 홈 히어로로 고정.
-- stage_posts.featured=true인 영상을 홈이 우선 노출(없으면 기존 자동 로직: 멤버 하트 최다 → 최신).
-- 단일 대표: featured 설정 시 다른 featured는 자동 해제.

alter table stage_posts add column if not exists featured boolean not null default false;
create index if not exists idx_stage_posts_featured on stage_posts (created_at desc) where featured;

-- 공개 뷰에 featured 노출 (기존 컬럼 순서 유지 + 맨 끝 추가)
create or replace view stage_posts_public as
  select p.id, p.stage_id, p.platform, p.source_url, p.external_id, p.title, p.description,
         p.handle, p.handle_verified, p.category, p.like_count, p.created_at,
         (p.updated_at > p.created_at) as edited,
         p.oembed->>'thumbnail_url' as thumbnail_url,
         p.oembed->>'title'         as oembed_title,
         p.oembed->>'author_name'   as oembed_author,
         p.view_count, p.is_official, p.featured
  from stage_posts p
  join stages s on s.id = p.stage_id and s.hidden = false
  where p.hidden = false;

-- 대표 지정/해제 RPC (관리자 전용) — 단일 대표(설정 시 나머지 해제)
create or replace function stage_set_featured(p_post uuid, p_on boolean)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_on then
    update stage_posts set featured = false where featured and id <> p_post;
    update stage_posts set featured = true  where id = p_post and hidden = false;
  else
    update stage_posts set featured = false where id = p_post;
  end if;
  return jsonb_build_object('ok', true);
end $$;
revoke execute on function stage_set_featured(uuid, boolean) from public, anon, authenticated;
grant  execute on function stage_set_featured(uuid, boolean) to service_role;
