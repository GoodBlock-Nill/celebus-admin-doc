-- 016-보강: SSO 최초 로그인 = 가입 — 퍼널 signup_done 자동 기록(대시보드 가입전환 KPI 연속성)
create or replace function game_sso_login(
  p_player_hash text,
  p_anon_id     text,
  p_uid         text,
  p_nickname    text,
  p_avatar      text
) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_nick text := coalesce(nullif(trim(p_nickname), ''), 'fan_' || right(p_uid, 6));
  r game_profiles%rowtype;
  v_created boolean := false;
begin
  if p_uid is null or length(p_uid) < 1 then
    return jsonb_build_object('error', 'bad_uid');
  end if;

  select * into r from game_profiles where celebus_uid = p_uid;

  if found then
    update game_profiles
       set nickname = case
             when lower(v_nick) <> lower(r.nickname)
              and exists (select 1 from game_profiles g where lower(g.nickname) = lower(v_nick) and g.celebus_uid <> p_uid)
             then r.nickname  -- 타 계정과 충돌 시 기존 닉네임 유지
             else v_nick end,
           avatar = coalesce(nullif(p_avatar, ''), r.avatar),
           last_login_at = now()
     where celebus_uid = p_uid;
  else
    if exists (select 1 from game_profiles g where lower(g.nickname) = lower(v_nick)) then
      v_nick := v_nick || '_' || right(p_uid, 4);
    end if;
    insert into game_profiles (player_hash, anon_id, nickname, celebus_uid, avatar, last_login_at)
    values (p_player_hash, p_anon_id, v_nick, p_uid, nullif(p_avatar, ''), now());
    v_created := true;
    -- 최초 SSO 로그인 = 가입 완료 퍼널
    insert into game_funnel (day, step, count)
    values ((now() at time zone 'Asia/Seoul')::date, 'signup_done', 1)
    on conflict (day, step) do update set count = game_funnel.count + 1;
  end if;

  select * into r from game_profiles where celebus_uid = p_uid;
  return jsonb_build_object(
    'ok', true, 'signed_up', true, 'created', v_created,
    'nickname', r.nickname, 'avatar', r.avatar, 'is_member', r.is_member);
end $$;
