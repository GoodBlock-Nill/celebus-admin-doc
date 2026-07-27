-- 018: 하위호환 shim — 구 7인자 game_submit_score 복원 (블루-그린 배포용)
--   사유: 017이 7인자 함수를 drop → 아직 배포 안 된 운영(구 코드, 7인자 호출)의 점수 제출이 즉시 실패.
--   운영을 즉시 정상화하기 위해 012 원본 동작(matchId 미검증)을 7인자로 복원.
--   신 코드 배포 후 8인자(017)를 사용하며, 안정화되면 별도 마이그레이션으로 이 7인자를 다시 제거.
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

  select nickname, avatar into v_pnick, v_pav from game_profiles where player_hash = p_player_hash;
  if v_pnick is not null then
    v_nick := left(v_pnick, 16);
    v_av := coalesce(left(nullif(trim(v_pav), ''), 200), v_av);
  end if;

  if exists (select 1 from game_banned_words w where lower(v_nick) like '%' || w.word || '%') then
    v_nick := '익명';
  end if;

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
