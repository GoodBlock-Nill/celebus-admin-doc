-- ─────────────────────────────────────────────────────────────
-- 012: Wave A — 파일럿 기반 정비
--  ① 이상 점수 탐지: 같은 계정의 제출 간격이 물리적 최소 판 길이보다 짧으면 flagged + 관리자 로그
--  ② 가입 퍼널 카운터 (KST 일자별 visit/gate_view/signup_start/signup_done/first_game)
--  ③ 관리자 비밀번호 재설정 (분실 CS)
--  ④ 대시보드 통계 확장 (퍼널·D1 리텐션)
--  ⑤ 관리자 리더보드에 의심 계정 플래그 표시
-- ─────────────────────────────────────────────────────────────

-- ① 의심 플래그 컬럼
alter table game_scores add column if not exists flagged boolean not null default false;

-- 점수 제출 재작성 (009 기반 + 간격 탐지) — 시그니처 불변
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
  -- 물리적 최소 판 길이 = 라운드 길이 - 5초 여유 (config 연동)
  v_min_gap int := coalesce((select (config -> 'game' ->> 'seconds')::int from game_config where id = 1), 60) - 5;
  v_prev timestamptz;
  v_flag boolean := false;
begin
  if p_mode not in ('daily', 'free') then return jsonb_build_object('error', 'bad_mode'); end if;
  if p_score < 0 or p_score > 1000000 then return jsonb_build_object('error', 'bad_score'); end if;
  if p_level < 1 or p_level > 999 then return jsonb_build_object('error', 'bad_level'); end if;

  v_lo := (p_level - 1) * v_base + v_step * ((p_level - 1) * (p_level - 2) / 2);
  v_hi := p_level * v_base + v_step * (p_level * (p_level - 1) / 2);
  if p_score < v_lo or p_score >= v_hi then
    return jsonb_build_object('error', 'bad_score_level');
  end if;

  -- 프로필(가입 계정) 존재 시 닉네임·아바타는 서버 권위
  select nickname, avatar into v_pnick, v_pav from game_profiles where player_hash = p_player_hash;
  if v_pnick is not null then
    v_nick := left(v_pnick, 16);
    v_av := coalesce(left(nullif(trim(v_pav), ''), 200), v_av);
  end if;

  if exists (select 1 from game_banned_words w where lower(v_nick) like '%' || w.word || '%') then
    v_nick := '익명';
  end if;

  -- 이상 탐지: 직전 제출과의 간격 < 최소 판 길이 → 물리적으로 불가능한 연속 제출
  select max(created_at) into v_prev from game_scores where player_hash = p_player_hash;
  if v_prev is not null and now() - v_prev < make_interval(secs => v_min_gap) then
    v_flag := true;
    insert into game_admin_log (action, target, detail)
    values ('suspect_score', p_player_hash,
            jsonb_build_object('score', p_score, 'level', p_level, 'mode', p_mode,
                               'gap_sec', floor(extract(epoch from now() - v_prev))));
  end if;

  insert into game_scores (player_hash, nickname, avatar, mode, seed, score, level, flagged)
  values (p_player_hash, v_nick, v_av, p_mode, p_seed, p_score, p_level, v_flag);

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

-- ② 가입 퍼널 카운터 (KST 일자별)
create table if not exists game_funnel (
  day   date not null,
  step  text not null,
  count int  not null default 0,
  primary key (day, step)
);
alter table game_funnel enable row level security; -- service_role 전용

create or replace function game_track_funnel(p_step text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_step not in ('visit', 'gate_view', 'signup_start', 'signup_done', 'first_game') then return; end if;
  insert into game_funnel (day, step, count)
  values ((now() at time zone 'Asia/Seoul')::date, p_step, 1)
  on conflict (day, step) do update set count = game_funnel.count + 1;
end $$;
revoke execute on function game_track_funnel(text) from public, anon, authenticated;
grant  execute on function game_track_funnel(text) to service_role;

-- ③ 관리자 비밀번호 재설정 (분실 CS — 전화번호 대조 후 수동)
create or replace function admin_reset_password(p_h text, p_password text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_password is null or length(p_password) < 8 or length(p_password) > 72 then
    return jsonb_build_object('error', 'bad_password');
  end if;
  update game_profiles set password_hash = crypt(p_password, gen_salt('bf', 10)) where player_hash = p_h;
  if not found then return jsonb_build_object('error', 'not_found'); end if;
  return jsonb_build_object('ok', true);
end $$;
revoke execute on function admin_reset_password(text, text) from public, anon, authenticated;
grant  execute on function admin_reset_password(text, text) to service_role;

-- ④ 대시보드 통계 확장 — 퍼널(오늘) + D1 리텐션(어제 가입자 중 오늘 플레이)
create or replace function admin_game_stats()
returns jsonb language sql security definer set search_path = public, extensions as $$
  with today as (select (now() at time zone 'Asia/Seoul')::date as d)
  select jsonb_build_object(
    'profiles_total', (select count(*) from game_profiles),
    'profiles_today', (select count(*) from game_profiles, today where (created_at at time zone 'Asia/Seoul')::date = d),
    'scores_total',   (select count(*) from game_scores),
    'scores_today',   (select count(*) from game_scores, today where (created_at at time zone 'Asia/Seoul')::date = d),
    'players_today',  (select count(distinct player_hash) from game_scores, today where (created_at at time zone 'Asia/Seoul')::date = d),
    'cp_minted',      (select coalesce(sum(delta), 0) from game_point_ledger where delta > 0),
    'cp_burned',      (select coalesce(-sum(delta), 0) from game_point_ledger where delta < 0),
    'daily_claims_today', (select count(*) from game_daily_claim, today where last_claim_date = d),
    'funnel_today',   (select coalesce(jsonb_object_agg(step, count), '{}'::jsonb) from game_funnel, today where day = d),
    'd1_cohort',      (select count(*) from game_profiles, today where (created_at at time zone 'Asia/Seoul')::date = d - 1),
    'd1_returned',    (select count(*) from game_profiles p, today
                        where (p.created_at at time zone 'Asia/Seoul')::date = d - 1
                          and exists (select 1 from game_scores s where s.player_hash = p.player_hash
                                        and (s.created_at at time zone 'Asia/Seoul')::date = d)),
    'flagged_total',  (select count(distinct player_hash) from game_scores where flagged)
  );
$$;

-- ⑤ 관리자 리더보드에 의심 플래그 표시 (해당 유저에 flagged 기록 존재 여부)
create or replace function admin_leaderboard(p_mode text, p_limit int default 50)
returns jsonb language sql security definer set search_path = public, extensions as $$
  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
    select row_number() over (order by level desc, score desc, created_at asc) as rank,
           player_hash, nickname, avatar, level, score, created_at,
           exists (select 1 from game_scores f where f.player_hash = best.player_hash and f.flagged) as flagged
    from (
      select distinct on (player_hash) player_hash, nickname, avatar, level, score, created_at
      from game_scores where mode = p_mode
      order by player_hash, level desc, score desc, created_at asc
    ) best
    order by level desc, score desc, created_at asc
    limit least(greatest(p_limit, 1), 200)
  ) t;
$$;

create or replace function admin_leaderboard_preset(p_mode text, p_preset text, p_limit int default 100)
returns jsonb
language plpgsql stable security definer set search_path = public, extensions as $$
declare
  v_kst timestamp := now() at time zone 'Asia/Seoul';
  v_from timestamptz := '-infinity';
  v_to   timestamptz := 'infinity';
begin
  if p_preset = 'this_week' then
    v_from := date_trunc('week', v_kst) at time zone 'Asia/Seoul';
  elsif p_preset = 'last_week' then
    v_from := (date_trunc('week', v_kst) - interval '7 days') at time zone 'Asia/Seoul';
    v_to   := date_trunc('week', v_kst) at time zone 'Asia/Seoul';
  elsif p_preset = 'this_month' then
    v_from := date_trunc('month', v_kst) at time zone 'Asia/Seoul';
  elsif p_preset = 'last_month' then
    v_from := (date_trunc('month', v_kst) - interval '1 month') at time zone 'Asia/Seoul';
    v_to   := date_trunc('month', v_kst) at time zone 'Asia/Seoul';
  end if;

  return (
    with best as (
      select distinct on (player_hash) player_hash, nickname, avatar, level, score, created_at
      from game_scores
      where mode = p_mode and created_at >= v_from and created_at < v_to
      order by player_hash, level desc, score desc, created_at asc
    )
    select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
      select row_number() over (order by level desc, score desc, created_at asc) as rank,
             player_hash, nickname, avatar, level, score, created_at,
             exists (select 1 from game_scores f where f.player_hash = best.player_hash and f.flagged) as flagged
      from best
      order by level desc, score desc, created_at asc
      limit least(greatest(coalesce(p_limit, 100), 1), 200)
    ) t
  );
end $$;
