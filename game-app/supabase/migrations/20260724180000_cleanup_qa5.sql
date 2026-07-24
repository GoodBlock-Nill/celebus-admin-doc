-- 2026-07-24: Wave A 검증 QA 정리 + 퍼널 테스트 카운터 초기화 — 초기 상태 유지.
delete from game_scores where player_hash in (select player_hash from game_profiles where nickname like 'qa.%');
delete from game_wallet where player_hash in (select player_hash from game_profiles where nickname like 'qa.%');
delete from game_inventory where player_hash in (select player_hash from game_profiles where nickname like 'qa.%');
delete from game_point_ledger where player_hash in (select player_hash from game_profiles where nickname like 'qa.%');
delete from game_profiles where nickname like 'qa.%';
delete from game_funnel;
delete from game_admin_log where action in ('suspect_score', 'reset_password', 'config_update');
