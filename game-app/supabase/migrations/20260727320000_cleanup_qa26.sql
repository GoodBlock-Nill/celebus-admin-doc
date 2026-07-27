-- QA 정리 26: V01D 강조 미리보기용 qa.* 계정 제거 (실유저 보호 — qa.% 만. joju 등 실유저는 미변경)
do $$
declare h text;
begin
  for h in select player_hash from game_profiles where nickname like 'qa.%' loop
    delete from game_match where player_hash = h; delete from game_scores where player_hash = h;
    delete from game_wallet where player_hash = h; delete from game_inventory where player_hash = h;
    delete from game_point_ledger where player_hash = h; delete from game_daily_claim where player_hash = h;
    delete from game_mission_claim where player_hash = h; delete from game_week_rewards where player_hash = h;
    delete from game_profiles where player_hash = h;
  end loop;
end $$;
