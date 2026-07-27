-- 021: 회원 상세에 의심 점수(flagged) 건수 추가 — 운영자가 상세에서 바로 어뷰징 여부 확인
--   additive(필드 추가) — 구 프로드 클라이언트 무영향.
create or replace function admin_profile_detail(p_h text)
returns jsonb language sql security definer set search_path = public, extensions as $$
  select jsonb_build_object(
    'profile', (select row_to_json(p) from (
        select player_hash, nickname, avatar, created_at, last_login_at, is_member
        from game_profiles where player_hash = p_h) p),
    'celeb_point', (select coalesce(celeb_point, 0) from game_wallet where player_hash = p_h),
    'inventory', (select coalesce(jsonb_object_agg(item_type, qty), '{}'::jsonb) from game_inventory where player_hash = p_h),
    'best_normal', (select row_to_json(b) from (
        select level, score from game_scores where player_hash = p_h and mode = 'daily'
        order by level desc, score desc limit 1) b),
    'best_item', (select row_to_json(b) from (
        select level, score from game_scores where player_hash = p_h and mode = 'free'
        order by level desc, score desc limit 1) b),
    'scores_count', (select count(*) from game_scores where player_hash = p_h),
    'flagged_count', (select count(*) from game_scores where player_hash = p_h and flagged),
    'ledger', (select coalesce(jsonb_agg(row_to_json(l)), '[]'::jsonb) from (
        select delta, reason, created_at from game_point_ledger where player_hash = p_h
        order by created_at desc limit 20) l)
  );
$$;
