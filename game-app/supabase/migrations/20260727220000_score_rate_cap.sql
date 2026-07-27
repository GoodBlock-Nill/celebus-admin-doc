-- ─────────────────────────────────────────────────────────────
-- 026: 점수 위조 방어 Step 1.5 — 초당 점수율 상한 + 소요시간 기록 + 주간 보상서 의심 제외
--   근거: 이 게임은 레벨업으로 시간이 늘어야 고득점 → 정상 고득점은 긴 플레이 동반.
--         "짧은 시간에 큰 점수"(스크립트)는 초당 점수율이 비정상 → 상한으로 하드 거부.
--   상한/의심 임계는 config integrity.maxScorePerSec / suspectScorePerSec (관리자 튜닝).
--   소요시간(elapsed_sec)·match_id를 점수 행에 기록해 관리자 검토·향후 튜닝에 사용.
-- ─────────────────────────────────────────────────────────────

alter table game_scores add column if not exists elapsed_sec int;
alter table game_scores add column if not exists match_id uuid;

-- 점수 제출 재작성 (017 대체) — 초당 점수율 상한·의심 플래그·소요시간 기록 추가
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
revoke execute on function game_submit_score(text, text, text, text, bigint, int, int, text) from public, anon, authenticated;
grant  execute on function game_submit_score(text, text, text, text, bigint, int, int, text) to service_role;

-- 주간 보상 재작성 (013 대체) — 의심(flagged) 점수는 보상 순위에서 제외(자동 보상 어뷰징 차단)
create or replace function game_claim_week_reward(p_player_hash text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_week_start date := (date_trunc('week', now() at time zone 'Asia/Seoul'))::date - 7;
  v_from timestamptz := (v_week_start::timestamp) at time zone 'Asia/Seoul';
  v_to   timestamptz := ((v_week_start + 7)::timestamp) at time zone 'Asia/Seoul';
  v_table jsonb := coalesce(
    (select config -> 'rewards' -> 'weeklyTop' from game_config where id = 1),
    '[100,70,50,30,30,20,20,20,20,20]'::jsonb);
  r record;
  v_cp int; v_paid boolean; v_total int := 0;
  v_out jsonb := '{}'::jsonb;
  v_bal int;
begin
  for r in
    with best as (
      select distinct on (player_hash, mode) player_hash, mode, level, score, created_at
      from game_scores
      where created_at >= v_from and created_at < v_to and not flagged  -- 의심 점수 제외
      order by player_hash, mode, level desc, score desc, created_at asc
    )
    select m.mode,
           (select count(*) + 1 from best b
             where b.mode = m.mode
               and (b.level, b.score, -extract(epoch from b.created_at)) > (m.level, m.score, -extract(epoch from m.created_at))) as rank
    from best m
    where m.player_hash = p_player_hash
  loop
    v_cp := coalesce((v_table ->> (r.rank - 1)::int)::int, 0);
    v_paid := false;
    if v_cp > 0 then
      begin
        insert into game_week_rewards (player_hash, week_start, mode, rank, cp)
        values (p_player_hash, v_week_start, r.mode, r.rank::int, v_cp);
        v_paid := true;
      exception when unique_violation then
        v_paid := false; v_cp := 0;
      end;
      if v_paid then
        insert into game_wallet (player_hash, celeb_point)
        values (p_player_hash, v_cp)
        on conflict (player_hash) do update
          set celeb_point = game_wallet.celeb_point + excluded.celeb_point, updated_at = now();
        insert into game_point_ledger (player_hash, delta, reason)
        values (p_player_hash, v_cp, 'weekly_reward:' || v_week_start || ':' || r.mode || ':rank' || r.rank);
        v_total := v_total + v_cp;
      end if;
    end if;
    v_out := v_out || jsonb_build_object(
      case when r.mode = 'daily' then 'normal' else 'item' end,
      jsonb_build_object('rank', r.rank, 'cp', v_cp, 'paid', v_paid));
  end loop;

  if v_out = '{}'::jsonb then
    return jsonb_build_object('has_result', false);
  end if;
  select celeb_point into v_bal from game_wallet where player_hash = p_player_hash;
  return jsonb_build_object('has_result', true, 'week_start', v_week_start, 'rewards', v_out, 'total_cp', v_total, 'celeb_point', coalesce(v_bal, 0));
end $$;
revoke execute on function game_claim_week_reward(text) from public, anon, authenticated;
grant  execute on function game_claim_week_reward(text) to service_role;
