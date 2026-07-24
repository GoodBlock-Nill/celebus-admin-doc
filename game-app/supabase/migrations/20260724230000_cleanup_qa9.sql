-- 2026-07-24: now-playing pill 검증 QA 정리 — 초기 상태 유지.
delete from game_mission_claim where player_hash in (select player_hash from game_profiles where nickname like 'qa.%');
delete from game_scores where player_hash in (select player_hash from game_profiles where nickname like 'qa.%');
delete from game_wallet where player_hash in (select player_hash from game_profiles where nickname like 'qa.%');
delete from game_point_ledger where player_hash in (select player_hash from game_profiles where nickname like 'qa.%');
delete from game_profiles where nickname like 'qa.%';
delete from game_funnel;
