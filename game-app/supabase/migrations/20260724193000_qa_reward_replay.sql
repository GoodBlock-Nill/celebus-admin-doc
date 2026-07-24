-- QA 전용: 보상 모달 재현 위해 qa.waveb 지급 기록/지갑 원복 (재지급 검증)
delete from game_week_rewards where player_hash in (select player_hash from game_profiles where nickname = 'qa.waveb');
update game_wallet set celeb_point = 0 where player_hash in (select player_hash from game_profiles where nickname = 'qa.waveb');
