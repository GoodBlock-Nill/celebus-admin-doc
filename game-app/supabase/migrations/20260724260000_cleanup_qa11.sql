-- 2026-07-24: V01D 탭 검증 QA 정리 — ⚠️ 실유저 존재(oliver 등): 테스트 계정만 정확 매칭 삭제.
delete from game_mission_claim where player_hash in (select player_hash from game_profiles where nickname like 'qa.%' or nickname = 'v01d.jooyeon');
delete from game_scores where player_hash in (select player_hash from game_profiles where nickname like 'qa.%' or nickname = 'v01d.jooyeon');
delete from game_wallet where player_hash in (select player_hash from game_profiles where nickname like 'qa.%' or nickname = 'v01d.jooyeon');
delete from game_point_ledger where player_hash in (select player_hash from game_profiles where nickname like 'qa.%' or nickname = 'v01d.jooyeon');
delete from game_profiles where nickname like 'qa.%' or nickname = 'v01d.jooyeon';
