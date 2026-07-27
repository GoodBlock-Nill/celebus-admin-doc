-- 022: 관리자 회원·로그 페이지네이션 — offset 파라미터 추가(배열 반환 유지 = 구 프로드 무영향).
--   총 건수는 라우트가 별도 count로 계산. 상한 30 → 회원 78명 등 대량 조회 가능(더 보기).

-- 회원 검색 — offset 추가, 상한 확대, SSO 폐기 필드(phone) 제외
create or replace function admin_search_profiles(p_q text, p_limit int default 50, p_offset int default 0)
returns jsonb language sql security definer set search_path = public, extensions as $$
  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
    select player_hash, nickname, avatar, created_at, last_login_at, is_member
    from game_profiles
    where p_q = '' or nickname ilike '%' || p_q || '%'
    order by is_member desc, created_at desc
    limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0)
  ) t;
$$;

-- 활동 로그 — offset 추가(닉네임 조인 유지)
create or replace function admin_logs(p_limit int default 50, p_offset int default 0)
returns jsonb language sql security definer set search_path = public, extensions as $$
  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
    select l.action, l.target, l.detail, l.actor, l.created_at,
           p.nickname as target_nickname
    from game_admin_log l
    left join game_profiles p on p.player_hash = l.target
    order by l.created_at desc
    limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0)
  ) t;
$$;
revoke execute on function admin_logs(int, int) from public, anon, authenticated;
grant  execute on function admin_logs(int, int) to service_role;
