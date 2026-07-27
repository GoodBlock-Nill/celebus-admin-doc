-- QA 정리 18: 점수 무결성 테스트로 공유 DB에 생성된 qa.* 계정·점수·매치 제거 (실유저 보호 — qa.% 만)
do $$
declare h text;
begin
  for h in select player_hash from game_profiles where nickname like 'qa.%' loop
    delete from game_match where player_hash = h;
    delete from game_scores where player_hash = h;
    delete from game_wallet where player_hash = h;
    delete from game_inventory where player_hash = h;
    delete from game_point_ledger where player_hash = h;
    delete from game_daily_claim where player_hash = h;
    delete from game_mission_claim where player_hash = h;
    delete from game_week_rewards where player_hash = h;
    delete from game_profiles where player_hash = h;
  end loop;
  -- 소유자 없는(테스트) 매치 잔여 정리
  delete from game_match m where not exists (select 1 from game_profiles p where p.player_hash = m.player_hash);
end $$;
