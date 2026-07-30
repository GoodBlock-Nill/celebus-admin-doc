-- 024: 랭킹 탭 집계 뷰 — D10V 크리에이터 랭킹(최다업로드) / D10V Pick(최다우승). 팬영상만.

-- D10V 크리에이터 랭킹 — 팬 아카이브에 영상을 올린 유저(owner_id)별 업로드 수
create or replace view creator_ranking_public as
  select p.owner_id,
         nullif(max(u.nickname), '') as nickname,
         count(*) as uploads
  from stage_posts p
  join stages s on s.id = p.stage_id and s.hidden = false and s.is_official = false
  left join stage_users u on u.user_id = p.owner_id
  where p.hidden = false
  group by p.owner_id;
grant select on creator_ranking_public to anon, authenticated;

-- D10V Pick — 팬영상 중 토너먼트 최다우승(전 토너먼트 final_wins 합) 영상
-- 썸네일은 stage_posts_public(oembed→thumbnail_url 추출)에서 조회
create or replace view d10v_pick_public as
  select w.post_id, pp.stage_id, pp.title, pp.thumbnail_url, pp.handle,
         sum(w.final_wins) as total_wins,
         sum(w.match_wins) as total_match_wins
  from worldcup_stats w
  join stage_posts_public pp on pp.id = w.post_id
  join stages s on s.id = pp.stage_id and s.hidden = false and s.is_official = false
  group by w.post_id, pp.stage_id, pp.title, pp.thumbnail_url, pp.handle
  having sum(w.final_wins) > 0;
grant select on d10v_pick_public to anon, authenticated;
