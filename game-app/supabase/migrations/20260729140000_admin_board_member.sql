-- ─────────────────────────────────────────────────────────────
-- 032: 관리자 리더보드에 V01D 멤버 표시 (운영 편의 — 사용자 피드백)
--   admin_leaderboard / admin_leaderboard_preset 재작성: 시그니처·기존 동작 동일 유지 +
--   행에 `member`(game_profiles.is_member) 키 추가(additive — 구 클라는 추가 키 무시).
-- ─────────────────────────────────────────────────────────────

create or replace function admin_leaderboard(p_mode text, p_limit int default 50)
returns jsonb language sql security definer set search_path = public, extensions as $$
  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
    select row_number() over (order by level desc, score desc, created_at asc) as rank,
           player_hash, nickname, avatar, level, score, created_at,
           exists (select 1 from game_scores f where f.player_hash = best.player_hash and f.flagged) as flagged,
           coalesce((select is_member from game_profiles p where p.player_hash = best.player_hash), false) as member
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
             exists (select 1 from game_scores f where f.player_hash = best.player_hash and f.flagged) as flagged,
             coalesce((select is_member from game_profiles p where p.player_hash = best.player_hash), false) as member
      from best
      order by level desc, score desc, created_at asc
      limit least(greatest(coalesce(p_limit, 100), 1), 200)
    ) t
  );
end $$;

notify pgrst, 'reload schema';
