-- ─────────────────────────────────────────────────────────────
-- 017: 점수 위조 방어 Phase 1 (서버 발급 matchId + 시간 게이트 + SSO 계정 강제)
--   배경: 클라이언트가 보낸 점수를 그대로 저장 → 정합성만 맞춘 가짜 고득점 무제한 주입 가능(2026-07-27 제보).
--   Phase 1: ① 게임 시작 시 서버가 matchId+seed 발급(1회용) ② 제출은 matchId 필수·소유 검증
--            ③ 발급~제출 경과시간이 물리 최소(라운드-5초)보다 짧으면 거부 ④ 랭킹 제출은 프로필(SSO) 계정만
--   Phase 2(별도): move 로그 서버 리플레이로 점수 재계산.
-- ─────────────────────────────────────────────────────────────

create table if not exists game_match (
  match_id     uuid primary key default gen_random_uuid(),
  player_hash  text not null,
  mode         text not null check (mode in ('daily', 'free')),
  seed         bigint not null,
  issued_at    timestamptz not null default now(),
  submitted_at timestamptz,
  submitted    boolean not null default false
);
create index if not exists game_match_player_idx on game_match (player_hash, issued_at desc);
alter table game_match enable row level security; -- service_role 전용

-- 게임 시작 — 서버가 matchId·seed 발급(seed도 서버 소유). 프로필(SSO 로그인) 계정만 허용.
create or replace function game_start_match(p_player_hash text, p_mode text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_seed bigint;
  v_id   uuid;
begin
  if p_mode not in ('daily', 'free') then return jsonb_build_object('error', 'bad_mode'); end if;
  if not exists (select 1 from game_profiles where player_hash = p_player_hash) then
    return jsonb_build_object('error', 'no_profile');
  end if;

  -- 일반매치는 전원 동일 보드(KST 날짜 시드), 아이템매치는 판별 랜덤 시드
  if p_mode = 'daily' then
    v_seed := to_char((now() at time zone 'Asia/Seoul'), 'YYYYMMDD')::bigint;
  else
    v_seed := floor(random() * 2147483647)::bigint;
  end if;

  insert into game_match (player_hash, mode, seed)
  values (p_player_hash, p_mode, v_seed)
  returning match_id into v_id;

  return jsonb_build_object('match_id', v_id, 'seed', v_seed);
end $$;
revoke execute on function game_start_match(text, text) from public, anon, authenticated;
grant  execute on function game_start_match(text, text) to service_role;

-- 점수 제출 재작성 — matchId 검증·시간 게이트·프로필 강제 추가 (012 대체, +p_match_id)
drop function if exists game_submit_score(text, text, text, text, bigint, int, int);
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
  v_min_gap int := v_game_sec - 5; -- 물리적 최소 판 길이
  v_per_lvl numeric := coalesce((select (config -> 'integrity' ->> 'minSecPerLevel')::numeric from game_config where id = 1), 5);
  v_prev timestamptz;
  v_flag boolean := false;
  v_m game_match%rowtype;
  v_elapsed numeric;
begin
  if p_mode not in ('daily', 'free') then return jsonb_build_object('error', 'bad_mode'); end if;
  if p_score < 0 or p_score > 1000000 then return jsonb_build_object('error', 'bad_score'); end if;
  if p_level < 1 or p_level > 999 then return jsonb_build_object('error', 'bad_level'); end if;

  -- ① 랭킹 제출은 프로필(SSO 로그인) 계정만 — 게스트 사칭 경로 제거
  select nickname, avatar into v_pnick, v_pav from game_profiles where player_hash = p_player_hash;
  if v_pnick is null then return jsonb_build_object('error', 'no_profile'); end if;
  v_nick := left(v_pnick, 16);
  v_av := coalesce(left(nullif(trim(v_pav), ''), 200), v_av);

  -- ② matchId 검증 — 존재·소유·모드·1회용·시간 게이트
  if p_match_id is null or p_match_id !~ '^[0-9a-fA-F-]{36}$' then
    return jsonb_build_object('error', 'no_match');
  end if;
  select * into v_m from game_match where match_id = p_match_id::uuid;
  if not found or v_m.player_hash <> p_player_hash then return jsonb_build_object('error', 'bad_match'); end if;
  if v_m.submitted then return jsonb_build_object('error', 'match_used'); end if;
  if v_m.mode <> p_mode then return jsonb_build_object('error', 'match_mode'); end if;

  v_elapsed := extract(epoch from (now() - v_m.issued_at));
  -- 하드 거부: 한 판을 물리적으로 끝낼 수 없는 짧은 시간 (즉시 주입 차단, 오탐 0)
  if v_elapsed < v_min_gap then return jsonb_build_object('error', 'too_fast'); end if;

  update game_match set submitted = true, submitted_at = now() where match_id = v_m.match_id;

  -- seed는 서버 발급값이 권위 — 클라 제출 seed 무시
  -- 점수-레벨 정합성(구간 밖이면 거부)
  v_lo := (p_level - 1) * v_base + v_step * ((p_level - 1) * (p_level - 2) / 2);
  v_hi := p_level * v_base + v_step * (p_level * (p_level - 1) / 2);
  if p_score < v_lo or p_score >= v_hi then
    return jsonb_build_object('error', 'bad_score_level');
  end if;

  if exists (select 1 from game_banned_words w where lower(v_nick) like '%' || w.word || '%') then
    v_nick := '익명';
  end if;

  -- 플래그: 레벨 대비 비현실적으로 빠른 완주(하드 거부 위는 통과시키되 관리자 검토용 표시)
  if v_elapsed < v_min_gap + (p_level - 1) * v_per_lvl then v_flag := true; end if;
  -- 플래그: 직전 제출과의 간격이 최소 판 길이보다 짧음
  select max(created_at) into v_prev from game_scores where player_hash = p_player_hash;
  if v_prev is not null and now() - v_prev < make_interval(secs => v_min_gap) then v_flag := true; end if;

  if v_flag then
    insert into game_admin_log (action, target, detail)
    values ('suspect_score', p_player_hash,
            jsonb_build_object('score', p_score, 'level', p_level, 'mode', p_mode,
                               'elapsed_sec', floor(v_elapsed), 'match_id', v_m.match_id));
  end if;

  insert into game_scores (player_hash, nickname, avatar, mode, seed, score, level, flagged)
  values (p_player_hash, v_nick, v_av, p_mode, v_m.seed, p_score, p_level, v_flag);

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

-- 정리: 제보 시연으로 주입된 가짜 기록 제거 (정확 페이로드만 타겟 — 실유저 보호)
delete from game_scores where mode = 'free' and score = 99999 and level = 19 and seed = 20260724;
