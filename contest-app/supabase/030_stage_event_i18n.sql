-- 030: 아카이브(stages)·토너먼트(stage_events) 다국어(i18n) — 콘테스트와 동일 패턴.
-- base title/description = 한국어(ko). i18n jsonb = {"en":{"title","description"},"ja":{...}}.
-- 앱은 뷰어 언어로 localize하고, 미입력 시 ko(base)로 폴백한다.

alter table stages add column if not exists i18n jsonb;
alter table stage_events add column if not exists i18n jsonb;

-- stages_public: 기존 컬럼 순서 유지 + i18n 말미 추가
create or replace view stages_public as
  select s.id, s.title, s.description, s.cover_url, s.event_date, s.status, s.post_count, s.sort_order, s.created_at,
         s.is_official,
         s.i18n
  from stages s
  where s.hidden = false;
grant select on stages_public to anon, authenticated;

-- stage_events_public: 기존 컬럼 순서 유지 + i18n(+ 스테이지 i18n) 말미 추가
create or replace view stage_events_public as
  select e.id, e.stage_id, s.title as stage_title, e.title, e.description, e.status, e.ends_at, e.awards, e.created_at,
         e.type, e.submit_start_at, e.submit_end_at, e.rewards,
         e.reward_type, e.reward,
         e.category, s.is_official as stage_is_official,
         e.cover_url,
         e.i18n,
         s.i18n as stage_i18n
  from stage_events e
  join stages s on s.id = e.stage_id and s.hidden = false
  where e.status in ('open', 'announced');
grant select on stage_events_public to anon, authenticated;
