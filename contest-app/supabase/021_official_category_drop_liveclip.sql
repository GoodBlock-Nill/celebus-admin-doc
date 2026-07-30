-- 021: 공식 영상 카테고리 정리 — liveclip(Live Clip) 제거.
-- Live Clip은 V1DE0로 흡수되어 미사용(0건) → 허용 목록에서 제외.

alter table stage_posts drop constraint if exists stage_posts_category_check;
alter table stage_posts add constraint stage_posts_category_check
  check (category in (
    'fancam','cover','edit','etc',                              -- 팬 콘텐츠
    'v1de0','album01','oncam','log','azit','stud10','outv',     -- V01D 공식 플레이리스트
    'shorts'                                                     -- V01D 공식 (쇼츠)
  ));
