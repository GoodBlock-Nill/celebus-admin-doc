-- ─────────────────────────────────────────────────────────────
-- V01D POP (game-app) — 무결성: 서버 점수 타당성 + 닉네임 모더레이션  [W4-1]
-- 001~006 이후 실행. Supabase SQL Editor에 통째로 붙여넣기 (재실행 안전).
-- ─────────────────────────────────────────────────────────────

-- 닉네임 금칙어 (관리자 편집 — 최소·중립 세트로 시드, 이후 추가/삭제)
create table if not exists game_banned_words (
  word text primary key
);
alter table game_banned_words enable row level security;  -- 직접 접근 차단(RPC 경유만, anon 노출 없음)

insert into game_banned_words (word) values
  ('fuck'), ('shit'), ('bitch'), ('asshole'), ('nigger'), ('faggot'), ('cunt'),
  ('씨발'), ('시발'), ('개새끼'), ('병신'), ('지랄'), ('좆'), ('니미'), ('썅'),
  ('죽어'), ('섹스'),
  ('セックス'), ('死ね'), ('殺す')
on conflict (word) do nothing;

-- ── 점수 제출 재작성 — 점수↔레벨 타당성 검증 + 닉네임 금칙어 치환 (7-인자 시그니처 불변) ──
create or replace function game_submit_score(
  p_player_hash text, p_nickname text, p_avatar text, p_mode text, p_seed bigint, p_score int, p_level int
) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_nick   text := left(coalesce(nullif(trim(p_nickname), ''), '익명'), 16);
  v_av     text := left(nullif(trim(p_avatar), ''), 200);
  v_blevel int; v_bscore int;
  v_rank   int; v_total int;
  -- 레벨 파라미터는 game_config에서(클라와 동일 소스). 폴백 = 코드 기본 800/500.
  v_lv   jsonb := coalesce((select config -> 'levels' from game_config where id = 1), '{}'::jsonb);
  v_base int := coalesce((v_lv ->> 'baseTarget')::int, 800);
  v_step int := coalesce((v_lv ->> 'targetStep')::int, 500);
  v_lo   int; v_hi int;
begin
  if p_mode not in ('daily', 'free') then return jsonb_build_object('error', 'bad_mode'); end if;
  if p_score < 0 or p_score > 1000000 then return jsonb_build_object('error', 'bad_score'); end if;
  if p_level < 1 or p_level > 999 then return jsonb_build_object('error', 'bad_level'); end if;

  -- 타당성: 레벨 L 도달 시 누적 점수는 반드시 [T(L-1), T(L)). T(k)=k*base+step*k*(k-1)/2.
  v_lo := (p_level - 1) * v_base + v_step * ((p_level - 1) * (p_level - 2) / 2);
  v_hi := p_level * v_base + v_step * (p_level * (p_level - 1) / 2);
  if p_score < v_lo or p_score >= v_hi then
    return jsonb_build_object('error', 'bad_score_level');
  end if;

  -- 닉네임 금칙어 → '익명' 치환(점수는 유효, 표시만 익명)
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
