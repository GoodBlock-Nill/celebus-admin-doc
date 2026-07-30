-- 019: 공식 영상 카테고리 추가 — Live Clip / Shorts.
-- 018에서 정의한 공식 카테고리 세트에 liveclip, shorts 두 종을 추가한다.

alter table stage_posts drop constraint if exists stage_posts_category_check;
alter table stage_posts add constraint stage_posts_category_check
  check (category in (
    'fancam','cover','edit','etc',                              -- 팬 콘텐츠
    'v1de0','oncam','log','azit','stud10','outv',               -- V01D 공식 플레이리스트
    'liveclip','shorts'                                          -- V01D 공식 (추가)
  ));
