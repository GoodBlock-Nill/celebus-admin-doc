-- 025: 토너먼트 참여자 수 — 대회별 참여(플레이) 인원(신원 distinct). 목록·인트로 표시용.
create or replace view event_participants_public as
  select event_id, count(distinct user_id) as participants
  from worldcup_runs
  group by event_id;
grant select on event_participants_public to anon, authenticated;
