-- 018: 공식 영상 카테고리 — V01D 공식 채널 플레이리스트 기준.
-- 팬 카테고리(fancam/cover/edit/etc)에 공식 카테고리(v1de0/oncam/log/azit/stud10/outv) 추가.
-- category 필드는 공용이며, UI에서 아카이브 유형(is_official)에 따라 노출 세트를 분기한다.

alter table stage_posts drop constraint if exists stage_posts_category_check;
alter table stage_posts add constraint stage_posts_category_check
  check (category in (
    'fancam','cover','edit','etc',          -- 팬 콘텐츠
    'v1de0','oncam','log','azit','stud10','outv'  -- V01D 공식 플레이리스트
  ));
