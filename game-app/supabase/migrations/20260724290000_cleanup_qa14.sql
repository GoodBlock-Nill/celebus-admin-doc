-- 2026-07-24: 노치 대응 검증 QA 정리 — 실유저 보호: qa.% 만.
delete from game_mission_claim where player_hash in (select player_hash from game_profiles where nickname like 'qa.%');
delete from game_scores where player_hash in (select player_hash from game_profiles where nickname like 'qa.%');
delete from game_wallet where player_hash in (select player_hash from game_profiles where nickname like 'qa.%');
delete from game_point_ledger where player_hash in (select player_hash from game_profiles where nickname like 'qa.%');
delete from game_profiles where nickname like 'qa.%';
