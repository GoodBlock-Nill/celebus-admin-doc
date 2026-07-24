-- 2026-07-24 QA 전용: 방금 제출한 qa.waveb 점수를 '지난주'로 백데이트 — 주간 보상 lazy claim 검증용.
update game_scores set created_at = created_at - interval '7 days'
where player_hash in (select player_hash from game_profiles where nickname = 'qa.waveb');
