-- ─────────────────────────────────────────────────────────────
-- 009: 가입/로그인 무결성 보강
--  ① 점수 제출 시 닉네임·아바타를 프로필(서버 권위)로 override — 클라이언트 페이로드 신뢰 제거
--  ② 가입 닉네임 금칙어 검사 (제출 치환과 동일 사전 game_banned_words)
-- ─────────────────────────────────────────────────────────────

-- ① 점수 제출 재작성 (7-인자 시그니처 불변) — 프로필 있으면 그 닉네임/아바타가 권위
create or replace function game_submit_score(
  p_player_hash text, p_nickname text, p_avatar text, p_mode text, p_seed bigint, p_score int, p_level int
) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_nick   text := left(coalesce(nullif(trim(p_nickname), ''), '익명'), 16);
  v_av     text := left(nullif(trim(p_avatar), ''), 200);
  v_pnick  text; v_pav text;
  v_blevel int; v_bscore int;
  v_rank   int; v_total int;
  v_lv   jsonb := coalesce((select config -> 'levels' from game_config where id = 1), '{}'::jsonb);
  v_base int := coalesce((v_lv ->> 'baseTarget')::int, 800);
  v_step int := coalesce((v_lv ->> 'targetStep')::int, 500);
  v_lo   int; v_hi int;
begin
  if p_mode not in ('daily', 'free') then return jsonb_build_object('error', 'bad_mode'); end if;
  if p_score < 0 or p_score > 1000000 then return jsonb_build_object('error', 'bad_score'); end if;
  if p_level < 1 or p_level > 999 then return jsonb_build_object('error', 'bad_level'); end if;

  v_lo := (p_level - 1) * v_base + v_step * ((p_level - 1) * (p_level - 2) / 2);
  v_hi := p_level * v_base + v_step * (p_level * (p_level - 1) / 2);
  if p_score < v_lo or p_score >= v_hi then
    return jsonb_build_object('error', 'bad_score_level');
  end if;

  -- 프로필(가입 계정) 존재 시 닉네임·아바타는 서버 권위로 강제 — 리더보드 표시 정합
  select nickname, avatar into v_pnick, v_pav from game_profiles where player_hash = p_player_hash;
  if v_pnick is not null then
    v_nick := left(v_pnick, 16);
    v_av := coalesce(left(nullif(trim(v_pav), ''), 200), v_av);
  end if;

  -- 닉네임 금칙어 → '익명' 치환(점수는 유효, 표시만 익명) — 레거시 미가입 제출 방어
  if exists (select 1 from game_banned_words w where lower(v_nick) like '%' || w.word || '%') then
    v_nick := '익명';
  end if;

  insert into game_scores (player_hash, nickname, avatar, mode, seed, score, level)
  values (p_player_hash, v_nick, v_av, p_mode, p_seed, p_score, p_level);

  with best as (
    select distinct on (player_hash) player_hash, level, score
    from game_scores where mode = p_mode
    order by player_hash, level desc, score desc, created_at asc
  ), me as (select level, score from best where player_hash = p_player_hash)
  select (select count(*) from best b cross join me where (b.level, b.score) > (me.level, me.score)) + 1,
         (select count(*) from best),
         (select level from me),
         (select score from me)
  into v_rank, v_total, v_blevel, v_bscore;

  return jsonb_build_object('rank', v_rank, 'total', v_total, 'best_level', v_blevel, 'best_score', v_bscore);
end $$;

revoke execute on function game_submit_score(text, text, text, text, bigint, int, int) from public, anon, authenticated;
grant  execute on function game_submit_score(text, text, text, text, bigint, int, int) to service_role;

-- ② 가입 재작성 — 금칙어 닉네임 거절 (banned_nickname)
create or replace function game_signup(
  p_player_hash text,
  p_anon_id     text,
  p_nickname    text,
  p_phone_cc    text,
  p_phone       text,
  p_password    text,
  p_avatar      text
) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_nickname is null or p_nickname !~ '^[a-z0-9._-]{3,20}$' then
    return jsonb_build_object('error', 'bad_nickname');
  end if;
  if exists (select 1 from game_banned_words w where lower(p_nickname) like '%' || w.word || '%') then
    return jsonb_build_object('error', 'banned_nickname');
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
