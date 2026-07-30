-- 020: 공식 영상 카테고리 추가 — 1st Mini Album [01].
-- 019까지의 공식 카테고리 세트에 album01(V01D 1st Mini Album 01 플레이리스트)을 추가한다.

alter table stage_posts drop constraint if exists stage_posts_category_check;
alter table stage_posts add constraint stage_posts_category_check
  check (category in (
    'fancam','cover','edit','etc',                              -- 팬 콘텐츠
    'v1de0','album01','oncam','log','azit','stud10','outv',     -- V01D 공식 플레이리스트
    'liveclip','shorts'                                          -- V01D 공식 (추가)
  ));
