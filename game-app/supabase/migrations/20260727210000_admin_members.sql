-- 025: 회원 목록 리치 조회 — 필터(전체/멤버/의심) + CP·판수·의심 포함 + 필터 반영 총건수.
--   신 RPC(additive) — 구 프로드는 admin_search_profiles 사용, 무영향. 신 회원 화면은 이 RPC 사용.
create or replace function admin_members(p_q text, p_filter text default 'all', p_limit int default 50, p_offset int default 0)
returns jsonb language sql security definer set search_path = public, extensions as $$
  with base as (
    select p.player_hash, p.nickname, p.avatar, p.is_member, p.created_at, p.last_login_at,
           coalesce(w.celeb_point, 0)::int as celeb_point,
           (select count(*) from game_scores s where s.player_hash = p.player_hash)::int as scores_count,
           exists (select 1 from game_scores s where s.player_hash = p.player_hash and s.flagged) as flagged
    from game_profiles p
    left join game_wallet w on w.player_hash = p.player_hash
    where p_q = '' or p.nickname ilike '%' || p_q || '%'
  ), filtered as (
    select * from base
    where case p_filter when 'member' then is_member when 'flagged' then flagged else true end
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'rows', coalesce((select jsonb_agg(row_to_json(t)) from (
        select * from filtered
        order by is_member desc, created_at desc
        limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0)) t), '[]'::jsonb)
  );
$$;
revoke execute on function admin_members(text, text, int, int) from public, anon, authenticated;
grant  execute on function admin_members(text, text, int, int) to service_role;
