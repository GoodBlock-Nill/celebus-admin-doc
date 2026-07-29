-- 017: 게시자 닉네임 노출 — 영상에 원본 SNS 핸들 + 올린 사람(게시자) 닉네임 함께 표시.
-- stage_posts.owner_id → stage_users.nickname 조인. 공식 시드(owner_id='official')는 닉네임 null.

create or replace view stage_posts_public as
  select p.id, p.stage_id, p.platform, p.source_url, p.external_id, p.title, p.description,
         p.handle, p.handle_verified, p.category, p.like_count, p.created_at,
         (p.updated_at > p.created_at) as edited,
         p.oembed->>'thumbnail_url' as thumbnail_url,
         p.oembed->>'title'         as oembed_title,
         p.oembed->>'author_name'   as oembed_author,
         p.view_count, p.is_official, p.featured,
         nullif(u.nickname, '') as uploader_nickname
  from stage_posts p
  join stages s on s.id = p.stage_id and s.hidden = false
  left join stage_users u on u.user_id = p.owner_id
  where p.hidden = false;
