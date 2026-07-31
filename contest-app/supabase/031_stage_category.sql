-- 031: D10V(팬) 아카이브 카테고리 — 콘서트·버스킹·페스티벌·팬미팅·행사·팬메이드.
-- 공식(V01D) 아카이브는 대상 아님(공식 플레이리스트 분류는 stage_posts.category로 별도 운영).
-- key(concert/busking/festival/fanmeeting/event/fanmade)로 저장, 앱은 언어별 라벨로 표시.

alter table stages add column if not exists category text;

-- stages_public: 기존 컬럼 순서 유지 + category 말미 추가
create or replace view stages_public as
  select s.id, s.title, s.description, s.cover_url, s.event_date, s.status, s.post_count, s.sort_order, s.created_at,
         s.is_official,
         s.i18n,
         s.category
  from stages s
  where s.hidden = false;
grant select on stages_public to anon, authenticated;
