-- 022: 토너먼트 유형 분리 — 보상형(reward) / 인기투표형(popularity)
-- reward_type: 보상 유무. reward: 보상 내용(관리자 기재, 수동 지급). 인기투표형은 reward 비움.
-- (013의 type=worldcup|challenge 와는 별개 축 — worldcup 토너먼트의 보상 유무를 나눔)

alter table stage_events add column if not exists reward_type text not null default 'popularity'
  check (reward_type in ('reward', 'popularity'));
alter table stage_events add column if not exists reward text not null default '';

-- 공개 뷰 갱신 — 013 뷰의 13개 컬럼 순서 그대로 보존 + 끝에 reward_type, reward 추가
create or replace view stage_events_public as
  select e.id, e.stage_id, s.title as stage_title, e.title, e.description, e.status, e.ends_at, e.awards, e.created_at,
         e.type, e.submit_start_at, e.submit_end_at, e.rewards,
         e.reward_type, e.reward
  from stage_events e
  join stages s on s.id = e.stage_id and s.hidden = false
  where e.status in ('open', 'announced');
grant select on stage_events_public to anon, authenticated;
