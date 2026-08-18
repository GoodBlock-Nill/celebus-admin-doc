-- QA 정리 28: 오디오·4매치·BGM 검증 중 생성된 qa.* 테스트 계정 제거 (실유저 보호 — qa.% 만).
do $$
declare h text; n int := 0;
begin
  for h in select player_hash from game_profiles where nickname like 'qa.%' loop
    delete from game_match where player_hash = h; delete from game_scores where player_hash = h;
    delete from game_wallet where player_hash = h; delete from game_inventory where player_hash = h;
    delete from game_point_ledger where player_hash = h; delete from game_daily_claim where player_hash = h;
    delete from game_mission_claim where player_hash = h; delete from game_week_rewards where player_hash = h;
    delete from game_profiles where player_hash = h;
    n := n + 1;
  end loop;
  raise notice 'cleanup_qa28 removed % qa.* profiles', n;
end $$;
