-- ─────────────────────────────────────────────────────────────
-- 031: Wave A — CELEB PASS 시즌 누적 트랙 (피로감 개선 트랙 3단계)
--   배경: 목표가 "기록 경신"뿐인 구조의 번아웃 해독제 — 성과 무관(참여 기반) XP가
--   매판 쌓여 "진 판에도 뭔가 진행됐다"를 보장한다. 시즌 = KST 월 단위.
--   XP = xpBase + floor(min(경과초, xpSecCap) / xpSecDiv) → 판당 10~20 (조작 불가:
--   경과시간은 서버 match 발급~제출 시각). 의심(flagged) 판은 적립 제외.
--   보상 = CP·하트만(사용자 결정 — 시즌 테마는 추후 웨이브). config `pass`로 라이브 튜닝.
--   공유 DB 수칙: dev 선검증 후 프로드. game_submit_score는 026 정확 재현 + XP 적립·반환 키
--   추가(additive — 구 클라이언트는 추가 키 무시).
-- ─────────────────────────────────────────────────────────────

create table if not exists game_pass_xp (
  player_hash text not null,
  season      text not null,               -- 'YYYY-MM' (KST)
  xp          int  not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (player_hash, season)
);
alter table game_pass_xp enable row level security; -- service_role 전용

create table if not exists game_pass_claim (
  player_hash text not null,
  season      text not null,
  level       int  not null,
  created_at  timestamptz not null default now(),
  primary key (player_hash, season, level)  -- 중복 수령 차단
);
alter table game_pass_claim enable row level security;

-- 점수 제출 재작성 (026 대체) — CELEB PASS XP 적립 + 반환에 pass_* 키 추가
create or replace function game_submit_score(
  p_player_hash text, p_nickname text, p_avatar text, p_mode text,
  p_seed bigint, p_score int, p_level int, p_match_id text
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
  v_game_sec int := coalesce((select (config -> 'game' ->> 'seconds')::int from game_config where id = 1), 60);
  v_min_gap int := v_game_sec - 5;
  v_per_lvl  numeric := coalesce((select (config -> 'integrity' ->> 'minSecPerLevel')::numeric from game_config where id = 1), 5);
  v_max_sps  numeric := coalesce((select (config -> 'integrity' ->> 'maxScorePerSec')::numeric from game_config where id = 1), 800);
  v_susp_sps numeric := coalesce((select (config -> 'integrity' ->> 'suspectScorePerSec')::numeric from game_config where id = 1), 500);
  v_prev timestamptz;
  v_flag boolean := false;
  v_m game_match%rowtype;
  v_elapsed numeric;
  -- CELEB PASS (Wave A)
  v_pass jsonb := coalesce((select config -> 'pass' from game_config where id = 1), '{}'::jsonb);
  v_pxbase int     := coalesce((v_pass ->> 'xpBase')::int, 10);
  v_pxcap  numeric := coalesce((v_pass ->> 'xpSecCap')::numeric, 120);
  v_pxdiv  numeric := coalesce((v_pass ->> 'xpSecDiv')::numeric, 12);
  v_season text := to_char(now() at time zone 'Asia/Seoul', 'YYYY-MM');
  v_xp int := 0; v_pass_total int := 0;
begin
  if p_mode not in ('daily', 'free') then return jsonb_build_object('error', 'bad_mode'); end if;
  if p_score < 0 or p_score > 1000000 then return jsonb_build_object('error', 'bad_score'); end if;
  if p_level < 1 or p_level > 999 then return jsonb_build_object('error', 'bad_level'); end if;

  -- ① 랭킹 제출은 프로필(SSO 로그인) 계정만
  select nickname, avatar into v_pnick, v_pav from game_profiles where player_hash = p_player_hash;
  if v_pnick is null then return jsonb_build_object('error', 'no_profile'); end if;
  v_nick := left(v_pnick, 16);
  v_av := coalesce(left(nullif(trim(v_pav), ''), 200), v_av);

  -- ② matchId 검증
  if p_match_id is null or p_match_id !~ '^[0-9a-fA-F-]{36}$' then
    return jsonb_build_object('error', 'no_match');
  end if;
  select * into v_m from game_match where match_id = p_match_id::uuid;
  if not found or v_m.player_hash <> p_player_hash then return jsonb_build_object('error', 'bad_match'); end if;
  if v_m.submitted then return jsonb_build_object('error', 'match_used'); end if;
  if v_m.mode <> p_mode then return jsonb_build_object('error', 'match_mode'); end if;

  v_elapsed := extract(epoch from (now() - v_m.issued_at));
  -- 하드 거부: 물리적 최소 판 길이 미만
  if v_elapsed < v_min_gap then return jsonb_build_object('error', 'too_fast'); end if;
  -- 하드 거부: 초당 점수율 상한 초과 (짧은 시간 대량 점수 = 스크립트 조작)
  if v_elapsed > 0 and p_score > v_elapsed * v_max_sps then return jsonb_build_object('error', 'score_too_fast'); end if;

  update game_match set submitted = true, submitted_at = now() where match_id = v_m.match_id;

  -- 점수-레벨 정합성
  v_lo := (p_level - 1) * v_base + v_step * ((p_level - 1) * (p_level - 2) / 2);
  v_hi := p_level * v_base + v_step * (p_level * (p_level - 1) / 2);
  if p_score < v_lo or p_score >= v_hi then
    return jsonb_build_object('error', 'bad_score_level');
  end if;

  if exists (select 1 from game_banned_words w where lower(v_nick) like '%' || w.word || '%') then
    v_nick := '익명';
  end if;

  -- 플래그: 레벨 대비 과속 완주 / 초당 점수율 의심 / 직전 제출 간격 과소
  if v_elapsed < v_min_gap + (p_level - 1) * v_per_lvl then v_flag := true; end if;
  if v_elapsed > 0 and p_score > v_elapsed * v_susp_sps then v_flag := true; end if;
  select max(created_at) into v_prev from game_scores where player_hash = p_player_hash;
  if v_prev is not null and now() - v_prev < make_interval(secs => v_min_gap) then v_flag := true; end if;

  if v_flag then
    insert into game_admin_log (action, target, detail)
    values ('suspect_score', p_player_hash,
            jsonb_build_object('score', p_score, 'level', p_level, 'mode', p_mode,
                               'elapsed_sec', floor(v_elapsed), 'sps', round(p_score / greatest(v_elapsed, 1)), 'match_id', v_m.match_id));
  end if;

  insert into game_scores (player_hash, nickname, avatar, mode, seed, score, level, flagged, elapsed_sec, match_id)
  values (p_player_hash, v_nick, v_av, p_mode, v_m.seed, p_score, p_level, v_flag, floor(v_elapsed)::int, v_m.match_id);

  -- CELEB PASS XP 적립 — 성과 무관(참여 기반). 의심 판 제외(주간 보상과 동일 정책)
  if not v_flag and v_pxbase > 0 then
    v_xp := v_pxbase + floor(least(v_elapsed, v_pxcap) / greatest(v_pxdiv, 1))::int;
    insert into game_pass_xp (player_hash, season, xp)
    values (p_player_hash, v_season, v_xp)
    on conflict (player_hash, season) do update
      set xp = game_pass_xp.xp + excluded.xp, updated_at = now();
  end if;
  select coalesce(xp, 0) into v_pass_total from game_pass_xp where player_hash = p_player_hash and season = v_season;
  v_pass_total := coalesce(v_pass_total, 0);

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

  return jsonb_build_object('rank', v_rank, 'total', v_total, 'best_level', v_blevel, 'best_score', v_bscore,
                            'pass_xp_gained', v_xp, 'pass_xp', v_pass_total, 'pass_season', v_season);
end $$;
revoke execute on function game_submit_score(text, text, text, text, bigint, int, int, text) from public, anon, authenticated;
grant  execute on function game_submit_score(text, text, text, text, bigint, int, int, text) to service_role;

-- 패스 현황 — 현재 시즌 xp·수령 레벨 + (월초 7일 유예 중이면) 지난 시즌 미수령분
create or replace function game_pass_status(p_h text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_now_kst timestamp := now() at time zone 'Asia/Seoul';
  v_season  text := to_char(v_now_kst, 'YYYY-MM');
  v_prev_season text := to_char(date_trunc('month', v_now_kst) - interval '1 day', 'YYYY-MM');
  v_grace boolean := extract(day from v_now_kst) <= 7;
  v_xp int; v_claimed jsonb;
  v_pxp int; v_pclaimed jsonb; v_prev jsonb := null;
begin
  select coalesce(xp, 0) into v_xp from game_pass_xp where player_hash = p_h and season = v_season;
  v_xp := coalesce(v_xp, 0);
  select coalesce(jsonb_agg(level order by level), '[]'::jsonb) into v_claimed
  from game_pass_claim where player_hash = p_h and season = v_season;

  if v_grace then
    select xp into v_pxp from game_pass_xp where player_hash = p_h and season = v_prev_season;
    if v_pxp is not null then
      select coalesce(jsonb_agg(level order by level), '[]'::jsonb) into v_pclaimed
      from game_pass_claim where player_hash = p_h and season = v_prev_season;
      v_prev := jsonb_build_object('season', v_prev_season, 'xp', v_pxp, 'claimed', v_pclaimed);
    end if;
  end if;

  return jsonb_build_object('season', v_season, 'xp', v_xp, 'claimed', v_claimed, 'prev', v_prev);
end $$;
revoke execute on function game_pass_status(text) from public, anon, authenticated;
grant  execute on function game_pass_status(text) to service_role;

-- 패스 보상 일괄 수령 — 도달했지만 미수령인 모든 레벨을 한 번에 지급.
--   서버가 config(pass)에서 레벨·보상표를 재검증(클라 신뢰 없음). 시즌 = 현재 또는 유예 중 지난 시즌.
create or replace function game_pass_claim_all(p_h text, p_season text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_now_kst timestamp := now() at time zone 'Asia/Seoul';
  v_season  text := to_char(v_now_kst, 'YYYY-MM');
  v_prev_season text := to_char(date_trunc('month', v_now_kst) - interval '1 day', 'YYYY-MM');
  v_grace boolean := extract(day from v_now_kst) <= 7;
  v_pass jsonb := coalesce((select config -> 'pass' from game_config where id = 1), '{}'::jsonb);
  v_per  int := coalesce((v_pass ->> 'perLevel')::int, 100);
  v_max  int := coalesce((v_pass ->> 'maxLevel')::int, 30);
  v_defcp int := coalesce((v_pass ->> 'defaultCp')::int, 10);
  v_ms jsonb := coalesce(v_pass -> 'milestones', '[
    {"level":5,"cp":30,"hearts":1},{"level":10,"cp":30,"hearts":1},{"level":15,"cp":30,"hearts":1},
    {"level":20,"cp":50,"hearts":1},{"level":25,"cp":50,"hearts":2},{"level":30,"cp":100,"hearts":2}]'::jsonb);
  v_xp int; v_cap int; v_l int; v_ins int;
  v_cp int; v_hearts int;
  v_cp_total int := 0; v_hearts_total int := 0; v_claimed int := 0;
  v_bal int;
begin
  if not exists (select 1 from game_profiles where player_hash = p_h) then
    return jsonb_build_object('error', 'no_profile');
  end if;
  -- 시즌 검증: 현재 시즌 또는 (월초 7일 유예 중) 지난 시즌만
  if p_season <> v_season and not (v_grace and p_season = v_prev_season) then
    return jsonb_build_object('error', 'bad_season');
  end if;

  select coalesce(xp, 0) into v_xp from game_pass_xp where player_hash = p_h and season = p_season;
  v_xp := coalesce(v_xp, 0);
  v_cap := least(floor(v_xp / greatest(v_per, 1))::int, v_max);
  if v_cap < 1 then return jsonb_build_object('error', 'nothing'); end if;

  for v_l in 1..v_cap loop
    insert into game_pass_claim (player_hash, season, level)
    values (p_h, p_season, v_l)
    on conflict do nothing;
    get diagnostics v_ins = row_count;
    if v_ins > 0 then
      select coalesce((e ->> 'cp')::int, v_defcp), coalesce((e ->> 'hearts')::int, 0)
        into v_cp, v_hearts
      from jsonb_array_elements(v_ms) e where (e ->> 'level')::int = v_l;
      if v_cp is null then v_cp := v_defcp; v_hearts := 0; end if;
      v_cp_total := v_cp_total + v_cp;
      v_hearts_total := v_hearts_total + v_hearts;
      v_claimed := v_claimed + 1;
      v_cp := null; v_hearts := null;
    end if;
  end loop;

  if v_claimed = 0 then return jsonb_build_object('error', 'nothing'); end if;

  if v_cp_total > 0 then
    insert into game_wallet (player_hash, celeb_point) values (p_h, v_cp_total)
    on conflict (player_hash) do update
      set celeb_point = game_wallet.celeb_point + excluded.celeb_point, updated_at = now();
    insert into game_point_ledger (player_hash, delta, reason)
    values (p_h, v_cp_total, 'pass:' || p_season || ':' || v_claimed || '레벨');
  end if;
  if v_hearts_total > 0 then
    insert into game_inventory (player_hash, item_type, qty) values (p_h, 'heart', v_hearts_total)
    on conflict (player_hash, item_type) do update set qty = game_inventory.qty + excluded.qty;
  end if;

  select celeb_point into v_bal from game_wallet where player_hash = p_h;
  return jsonb_build_object('claimed', v_claimed, 'cp', v_cp_total, 'hearts', v_hearts_total, 'balance', coalesce(v_bal, 0));
end $$;
revoke execute on function game_pass_claim_all(text, text) from public, anon, authenticated;
grant  execute on function game_pass_claim_all(text, text) to service_role;

notify pgrst, 'reload schema';
