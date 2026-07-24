-- 008: 가입/로그인 프로필 — CELEBUS 통합 대비 닉네임·휴대전화 수집 + 비밀번호 인증
-- 신원 모델: 기존 서명 쿠키(anonId)→player_hash 체계에 프로필을 결합.
--   가입 = 현재 기기 신원에 프로필 부착 / 로그인 = 저장된 anon_id로 신원 쿠키 재발급(기기 이동).

create extension if not exists pgcrypto;

create table if not exists game_profiles (
  player_hash   text primary key,          -- 게임 계정 키 (scores·wallet과 동일 신원)
  anon_id       text not null,             -- 로그인 시 신원 쿠키 재발급용 원본 id (서버 전용 비밀)
  nickname      text not null,             -- ^[a-z0-9._-]{3,20}$ (CELEBUS 닉네임)
  phone_cc      text not null,             -- 국가번호 '+82'
  phone         text not null,             -- 숫자만 5~15자리
  password_hash text not null,             -- bcrypt (crypt + gen_salt('bf'))
  avatar        text,                      -- 기본 아바타 id 또는 업로드 이미지 URL
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);
create unique index if not exists game_profiles_nickname_key on game_profiles (lower(nickname));
create index if not exists game_profiles_phone_idx on game_profiles (phone_cc, phone);
alter table game_profiles enable row level security; -- 정책 없음 = service_role 전용

-- 가입 — 형식·중복 검증 + bcrypt 저장
create or replace function game_signup(
  p_player_hash text,
  p_anon_id     text,
  p_nickname    text,
  p_phone_cc    text,
  p_phone       text,
  p_password    text,
  p_avatar      text
) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if p_nickname is null or p_nickname !~ '^[a-z0-9._-]{3,20}$' then
    return jsonb_build_object('error', 'bad_nickname');
  end if;
  if p_phone_cc is null or p_phone_cc !~ '^\+[0-9]{1,4}$' or p_phone is null or p_phone !~ '^[0-9]{5,15}$' then
    return jsonb_build_object('error', 'bad_phone');
  end if;
  if p_password is null or length(p_password) < 8 or length(p_password) > 72 then
    return jsonb_build_object('error', 'bad_password');
  end if;
  if exists (select 1 from game_profiles where player_hash = p_player_hash) then
    return jsonb_build_object('error', 'already_signed_up');
  end if;
  if exists (select 1 from game_profiles where lower(nickname) = lower(p_nickname)) then
    return jsonb_build_object('error', 'nickname_taken');
  end if;
  insert into game_profiles (player_hash, anon_id, nickname, phone_cc, phone, password_hash, avatar)
  values (p_player_hash, p_anon_id, p_nickname, p_phone_cc, p_phone, crypt(p_password, gen_salt('bf', 10)), p_avatar);
  return jsonb_build_object('ok', true, 'nickname', p_nickname, 'avatar', p_avatar);
end $$;

-- 로그인 — 닉네임+비밀번호 검증 → 원 신원 반환(서버가 쿠키 재발급). 실패 사유 미구분(계정 열거 방지)
create or replace function game_login(p_nickname text, p_password text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare r game_profiles%rowtype;
begin
  select * into r from game_profiles where lower(nickname) = lower(coalesce(p_nickname, ''));
  if r.player_hash is null or r.password_hash <> crypt(coalesce(p_password, ''), r.password_hash) then
    return jsonb_build_object('error', 'invalid_credentials');
  end if;
  update game_profiles set last_login_at = now() where player_hash = r.player_hash;
  return jsonb_build_object('ok', true, 'anon_id', r.anon_id, 'nickname', r.nickname, 'avatar', r.avatar);
end $$;

-- 세션 프로필 조회
create or replace function game_get_profile(p_player_hash text)
returns jsonb
language sql security definer set search_path = public as $$
  select coalesce(
    (select jsonb_build_object(
       'signed_up', true,
       'nickname', nickname,
       'avatar', avatar,
       'phone_cc', phone_cc,
       'phone_last4', right(phone, 4))
     from game_profiles where player_hash = p_player_hash),
    jsonb_build_object('signed_up', false));
$$;

-- 아바타 변경 (기본 아바타 id 또는 업로드 이미지 URL)
create or replace function game_set_avatar(p_player_hash text, p_avatar text)
returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  update game_profiles set avatar = p_avatar where player_hash = p_player_hash;
  if not found then
    return jsonb_build_object('error', 'not_signed_up');
  end if;
  return jsonb_build_object('ok', true, 'avatar', p_avatar);
end $$;

-- 아바타 업로드 버킷 (public 읽기 — 쓰기는 service_role 전용)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;
