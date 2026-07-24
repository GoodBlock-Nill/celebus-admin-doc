-- 2026-07-24: 하트 상점 검증 QA 데이터 정리 — 초기 상태(가입 0명) 유지.
delete from game_scores where player_hash in (select player_hash from game_profiles where nickname like 'qa.%');
delete from game_wallet where player_hash in (select player_hash from game_profiles where nickname like 'qa.%');
delete from game_inventory where player_hash in (select player_hash from game_profiles where nickname like 'qa.%');
delete from game_point_ledger where player_hash in (select player_hash from game_profiles where nickname like 'qa.%');
delete from game_profiles where nickname like 'qa.%';
