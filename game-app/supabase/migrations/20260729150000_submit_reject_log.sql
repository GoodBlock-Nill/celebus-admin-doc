-- ─────────────────────────────────────────────────────────────
-- 033: 점수 제출 거부 로깅 (joju 5만점 유실 사건 후속 — 사용자 승인)
--   배경: 제출 하드 거부(no_match·bad_match·match_used·match_mode·too_fast·score_too_fast·
--   bad_score_level)가 아무 기록도 남기지 않아 유실 제보 시 원인 특정 불가.
--   → 거부 시 활동 로그(submit_rejected, actor=system)에 사유·점수·레벨·경과를 기록.
--   game_submit_score는 031 정확 재현 + 거부 경로만 로깅 헬퍼 경유(시그니처·정상 경로 불변).
--   입력 검증성 거부(no_profile·bad_mode·bad_score·bad_level)는 외부 프로브 노이즈라 제외.
-- ─────────────────────────────────────────────────────────────

create or replace function game_reject_submit(p_player_hash text, p_reason text, p_detail jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  insert into game_admin_log (action, target, detail, actor)
  values ('submit_rejected', p_player_hash, coalesce(p_detail, '{}'::jsonb) || jsonb_build_object('reason', p_reason), 'system');
  return jsonb_build_object('error', p_reason);
end $$;
revoke execute on function game_reject_submit(text, text, jsonb) from public, anon, authenticated;
grant  execute on function game_reject_submit(text, text, jsonb) to service_role;

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
  -- 거부 로깅 공통 상세
  v_d jsonb := jsonb_build_object('mode', p_mode, 'score', p_score, 'level', p_level, 'match_id', p_match_id);
begin
  if p_mode not in ('daily', 'free') then return jsonb_build_object('error', 'bad_mode'); end if;
  if p_score < 0 or p_score > 1000000 then return jsonb_build_object('error', 'bad_score'); end if;
  if p_level < 1 or p_level > 999 then return jsonb_build_object('error', 'bad_level'); end if;

  -- ① 랭킹 제출은 프로필(SSO 로그인) 계정만
  select nickname, avatar into v_pnick, v_pav from game_profiles where player_hash = p_player_hash;
  if v_pnick is null then return jsonb_build_object('error', 'no_profile'); end if;
  v_nick := left(v_pnick, 16);
  v_av := coalesce(left(nullif(trim(v_pav), ''), 200), v_av);

  -- ② matchId 검증 — 거부는 전부 로깅(유실 제보 시 원인 특정)
  if p_match_id is null or p_match_id !~ '^[0-9a-fA-F-]{36}$' then
    return game_reject_submit(p_player_hash, 'no_match', v_d);
  end if;
  select * into v_m from game_match where match_id = p_match_id::uuid;
  if not found or v_m.player_hash <> p_player_hash then return game_reject_submit(p_player_hash, 'bad_match', v_d); end if;
  if v_m.submitted then return game_reject_submit(p_player_hash, 'match_used', v_d); end if;
  if v_m.mode <> p_mode then return game_reject_submit(p_player_hash, 'match_mode', v_d); end if;

  v_elapsed := extract(epoch from (now() - v_m.issued_at));
  v_d := v_d || jsonb_build_object('elapsed_sec', floor(v_elapsed));
  -- 하드 거부: 물리적 최소 판 길이 미만
  if v_elapsed < v_min_gap then return game_reject_submit(p_player_hash, 'too_fast', v_d); end if;
  -- 하드 거부: 초당 점수율 상한 초과 (짧은 시간 대량 점수 = 스크립트 조작)
  if v_elapsed > 0 and p_score > v_elapsed * v_max_sps then return game_reject_submit(p_player_hash, 'score_too_fast', v_d); end if;

  update game_match set submitted = true, submitted_at = now() where match_id = v_m.match_id;

  -- 점수-레벨 정합성
  v_lo := (p_level - 1) * v_base + v_step * ((p_level - 1) * (p_level - 2) / 2);
  v_hi := p_level * v_base + v_step * (p_level * (p_level - 1) / 2);
  if p_score < v_lo or p_score >= v_hi then
    return game_reject_submit(p_player_hash, 'bad_score_level', v_d || jsonb_build_object('expect_lo', v_lo, 'expect_hi', v_hi));
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

notify pgrst, 'reload schema';
