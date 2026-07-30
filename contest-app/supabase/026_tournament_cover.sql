-- 026: 토너먼트 대표 커버 — 관리자가 토너먼트 등록 시 커버 이미지 지정(없으면 참가작 콜라주 fallback).
alter table stage_events add column if not exists cover_url text;

-- 공개 뷰 갱신 — 기존 17개 컬럼 순서 보존 + 끝에 cover_url 추가
create or replace view stage_events_public as
  select e.id, e.stage_id, s.title as stage_title, e.title, e.description, e.status, e.ends_at, e.awards, e.created_at,
         e.type, e.submit_start_at, e.submit_end_at, e.rewards,
         e.reward_type, e.reward,
         e.category, s.is_official as stage_is_official,
         e.cover_url
  from stage_events e
  join stages s on s.id = e.stage_id and s.hidden = false
  where e.status in ('open', 'announced');
grant select on stage_events_public to anon, authenticated;
