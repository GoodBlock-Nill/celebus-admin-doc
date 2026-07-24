-- 2026-07-24: 시드 버그 검증에 사용한 QA 데이터 정리 — 초기 상태(가입 0명) 유지.
-- 대상: qa.% 닉네임 프로필과 그 점수·지갑·원장 (실유저 없음 시점)

delete from game_scores where player_hash in (select player_hash from game_profiles where nickname like 'qa.%');
delete from game_wallet where player_hash in (select player_hash from game_profiles where nickname like 'qa.%');
delete from game_point_ledger where player_hash in (select player_hash from game_profiles where nickname like 'qa.%');
delete from game_profiles where nickname like 'qa.%';
