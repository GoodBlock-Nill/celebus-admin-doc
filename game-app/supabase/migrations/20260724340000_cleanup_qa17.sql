-- QA 정리 17: SSO·관리자 개편 검증용 qa.* 계정 제거 (실유저 보호 — qa.% 패턴만 삭제)
do $$
declare
  h text;
begin
  for h in select player_hash from game_profiles where nickname like 'qa.%' loop
    delete from game_scores where player_hash = h;
    delete from game_wallet where player_hash = h;
    delete from game_inventory where player_hash = h;
    delete from game_point_ledger where player_hash = h;
    delete from game_daily_claim where player_hash = h;
    delete from game_mission_claim where player_hash = h;
    delete from game_week_rewards where player_hash = h;
    delete from game_profiles where player_hash = h;
  end loop;
end $$;
