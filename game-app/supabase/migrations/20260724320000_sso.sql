-- ─────────────────────────────────────────────────────────────
-- 016: CELEBUS SSO 전환 — 기존 가입/로그인 폐기 + 유저 데이터 전체 초기화(사용자 확정)
--   신원: CELEBUS 앱 세션 쿠키 → 서버 검증(users/me) → celebus uid 기반 deterministic anon_id
--   기존 유저 데이터는 SSO 신원과 연결 불가하므로 초기화 후 재시작 (2026-07-24 사용자 지시)
-- ─────────────────────────────────────────────────────────────

-- 1) 플레이어 데이터 전체 초기화 (config·catalog·금칙어·관리자 로그는 유지)
truncate table game_scores;
truncate table game_wallet;
truncate table game_inventory;
truncate table game_point_ledger;
truncate table game_daily_claim;
truncate table game_mission_claim;
truncate table game_week_rewards;
truncate table game_funnel;
truncate table game_profiles;

-- 2) 프로필 스키마 — SSO 필드 추가, 자체 인증 필드는 임의값 불요
alter table game_profiles add column if not exists celebus_uid text;
create unique index if not exists game_profiles_celebus_uid_key on game_profiles (celebus_uid);
alter table game_profiles alter column phone_cc drop not null;
alter table game_profiles alter column phone drop not null;
alter table game_profiles alter column password_hash drop not null;

-- 3) SSO 로그인 upsert — 매 로그인마다 CELEBUS 최신 닉네임·아바타 동기화
--    닉네임 unique 인덱스와의 충돌은 celebus_uid가 다른 경우에만 발생 가능(본앱이 닉네임 유일성 보장 전제).
--    방어적으로 충돌 시 uid 접미 닉네임으로 저장.
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
  end if;

  select * into r from game_profiles where celebus_uid = p_uid;
  return jsonb_build_object(
    'ok', true, 'signed_up', true,
    'nickname', r.nickname, 'avatar', r.avatar, 'is_member', r.is_member);
end $$;
revoke execute on function game_sso_login(text, text, text, text, text) from public, anon, authenticated;
grant  execute on function game_sso_login(text, text, text, text, text) to service_role;

-- 4) 자체 가입/로그인 RPC 폐기 (SSO 전용 전환)
drop function if exists game_signup(text, text, text, text, text, text, text);
drop function if exists game_login(text, text);
drop function if exists admin_reset_password(text, text);
