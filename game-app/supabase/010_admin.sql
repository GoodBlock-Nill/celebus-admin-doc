-- ─────────────────────────────────────────────────────────────
-- 010: 게임 관리(/admin) — 감사 로그 + 운영 RPC
--  대시보드 통계 / 회원 검색·상세·제재 / 리더보드(관리용) / 기록 삭제 / CP 조정
--  모든 쓰기 액션은 라우트에서 game_admin_log에 기록.
-- ─────────────────────────────────────────────────────────────

-- 관리자 액션 감사 로그
create table if not exists game_admin_log (
  id         uuid primary key default gen_random_uuid(),
  action     text not null,            -- sanction / delete_scores / adjust_point / banned_add / banned_remove / config_update / catalog_update
  target     text,                     -- player_hash·단어 등 대상 식별자
  detail     jsonb,                    -- 액션 파라미터 스냅샷
  created_at timestamptz not null default now()
);
create index if not exists game_admin_log_idx on game_admin_log (created_at desc);
alter table game_admin_log enable row level security; -- service_role 전용

-- 대시보드 통계 (KST 오늘 기준)
create or replace function admin_game_stats()
returns jsonb language sql security definer set search_path = public, extensions as $$
  with today as (select (now() at time zone 'Asia/Seoul')::date as d)
  select jsonb_build_object(
    'profiles_total', (select count(*) from game_profiles),
    'profiles_today', (select count(*) from game_profiles, today where (created_at at time zone 'Asia/Seoul')::date = d),
    'scores_total',   (select count(*) from game_scores),
    'scores_today',   (select count(*) from game_scores, today where (created_at at time zone 'Asia/Seoul')::date = d),
    'players_today',  (select count(distinct player_hash) from game_scores, today where (created_at at time zone 'Asia/Seoul')::date = d),
    'cp_minted',      (select coalesce(sum(delta), 0) from game_point_ledger where delta > 0),
    'cp_burned',      (select coalesce(-sum(delta), 0) from game_point_ledger where delta < 0),
    'daily_claims_today', (select count(*) from game_daily_claim, today where last_claim_date = d)
  );
$$;

-- 회원 검색 (닉네임/전화 부분 일치)
create or replace function admin_search_profiles(p_q text, p_limit int default 30)
returns jsonb language sql security definer set search_path = public, extensions as $$
  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
    select player_hash, nickname, phone_cc, phone, avatar, created_at, last_login_at
    from game_profiles
    where p_q = '' or nickname ilike '%' || p_q || '%' or phone like '%' || p_q || '%'
    order by created_at desc
    limit least(greatest(p_limit, 1), 100)
  ) t;
$$;

-- 회원 상세 (프로필 + 지갑 + 인벤 + 모드별 베스트 + 최근 원장)
create or replace function admin_profile_detail(p_h text)
returns jsonb language sql security definer set search_path = public, extensions as $$
  select jsonb_build_object(
    'profile', (select row_to_json(p) from (
        select player_hash, nickname, phone_cc, phone, avatar, created_at, last_login_at
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
    'ledger', (select coalesce(jsonb_agg(row_to_json(l)), '[]'::jsonb) from (
        select delta, reason, created_at from game_point_ledger where player_hash = p_h
        order by created_at desc limit 20) l)
  );
$$;

-- 제재 — 닉네임 강제 초기화('usr_' + 해시 앞 8자) / 아바타 제거. 점수 행의 표시값도 함께 정리.
create or replace function admin_sanction_profile(p_h text, p_reset_nickname boolean, p_reset_avatar boolean)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_new_nick text := 'usr_' || left(p_h, 8);
begin
  if not exists (select 1 from game_profiles where player_hash = p_h) then
    return jsonb_build_object('error', 'not_found');
  end if;
  if p_reset_nickname then
    update game_profiles set nickname = v_new_nick where player_hash = p_h;
    update game_scores set nickname = v_new_nick where player_hash = p_h;
  end if;
  if p_reset_avatar then
    update game_profiles set avatar = null where player_hash = p_h;
    update game_scores set avatar = null where player_hash = p_h;
  end if;
  return jsonb_build_object('ok', true, 'nickname', (select nickname from game_profiles where player_hash = p_h));
end $$;

-- 기록 삭제 (치터 제거) — 모드 지정 없으면 전체
create or replace function admin_delete_scores(p_h text, p_mode text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_n int;
begin
  delete from game_scores where player_hash = p_h and (p_mode is null or mode = p_mode);
  get diagnostics v_n = row_count;
  return jsonb_build_object('deleted', v_n);
end $$;

-- 리더보드(관리용) — player_hash 포함 (공개 뷰에는 없음)
create or replace function admin_leaderboard(p_mode text, p_limit int default 50)
returns jsonb language sql security definer set search_path = public, extensions as $$
  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
    select row_number() over (order by level desc, score desc, created_at asc) as rank,
           player_hash, nickname, avatar, level, score, created_at
    from (
      select distinct on (player_hash) player_hash, nickname, avatar, level, score, created_at
      from game_scores where mode = p_mode
      order by player_hash, level desc, score desc, created_at asc
    ) best
    order by level desc, score desc, created_at asc
    limit least(greatest(p_limit, 1), 200)
  ) t;
$$;

-- CP 수동 지급/회수 (CS) — 잔액 0 미만 방지 클램프 + 원장 기록
create or replace function admin_adjust_point(p_h text, p_delta int, p_reason text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_bal int;
begin
  insert into game_wallet (player_hash, celeb_point) values (p_h, greatest(0, p_delta))
  on conflict (player_hash) do update set celeb_point = greatest(0, game_wallet.celeb_point + p_delta), updated_at = now()
  returning celeb_point into v_bal;
  insert into game_point_ledger (player_hash, delta, reason) values (p_h, p_delta, 'admin:' || coalesce(p_reason, ''));
  return jsonb_build_object('ok', true, 'celeb_point', v_bal);
end $$;

-- 전부 service_role 전용
revoke execute on function admin_game_stats() from public, anon, authenticated;
revoke execute on function admin_search_profiles(text, int) from public, anon, authenticated;
revoke execute on function admin_profile_detail(text) from public, anon, authenticated;
revoke execute on function admin_sanction_profile(text, boolean, boolean) from public, anon, authenticated;
revoke execute on function admin_delete_scores(text, text) from public, anon, authenticated;
revoke execute on function admin_leaderboard(text, int) from public, anon, authenticated;
revoke execute on function admin_adjust_point(text, int, text) from public, anon, authenticated;
grant execute on function admin_game_stats() to service_role;
grant execute on function admin_search_profiles(text, int) to service_role;
grant execute on function admin_profile_detail(text) to service_role;
grant execute on function admin_sanction_profile(text, boolean, boolean) to service_role;
grant execute on function admin_delete_scores(text, text) to service_role;
grant execute on function admin_leaderboard(text, int) to service_role;
grant execute on function admin_adjust_point(text, int, text) to service_role;
