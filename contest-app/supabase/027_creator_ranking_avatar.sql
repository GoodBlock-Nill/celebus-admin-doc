-- 027: 크리에이터 랭킹에 아바타 추가 — 랭킹 탭 크리에이터 섹션 프로필 표시용.
-- 기존 컬럼(owner_id, nickname, uploads) 순서 보존 + avatar_url을 끝에 추가.
create or replace view creator_ranking_public as
  select p.owner_id,
         nullif(max(u.nickname), '') as nickname,
         count(*) as uploads,
         nullif(max(u.avatar_url), '') as avatar_url
  from stage_posts p
  join stages s on s.id = p.stage_id and s.hidden = false and s.is_official = false
  left join stage_users u on u.user_id = p.owner_id
  where p.hidden = false
  group by p.owner_id;
grant select on creator_ranking_public to anon, authenticated;
