-- 031: V01D 멤버 표시 커스터마이즈 — 닉네임과 별도로 표시 이름·아바타 등록.
--   표시 이름 = coalesce(member_name, 닉네임). 표시 아바타 = CELEBUS 프로필 이미지(URL) 우선,
--   없으면 관리자 등록 member_avatar, 그것도 없으면 기존 avatar. 멤버가 아닌 유저는 변화 없음.
alter table game_profiles add column if not exists member_name text;
alter table game_profiles add column if not exists member_avatar text;

-- 기간 리더보드 — 멤버는 표시 이름/아바타 override
create or replace function game_leaderboard_period(p_mode text, p_period text, p_limit int default 100)
returns jsonb language sql stable security definer set search_path = public, extensions as $$
  with b as (select * from game_period_bounds(p_period)),
  best as (
    select distinct on (s.player_hash) s.player_hash, s.nickname, s.avatar, s.level, s.score, s.created_at
    from game_scores s, b
    where s.mode = p_mode and s.created_at >= b.t_from and s.created_at < b.t_to
    order by s.player_hash, s.level desc, s.score desc, s.created_at asc
  )
  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
    select row_number() over (order by best.level desc, best.score desc, best.created_at asc) as rank,
           case when coalesce(p.is_member, false) then coalesce(nullif(p.member_name, ''), p.nickname) else best.nickname end as nickname,
           case when coalesce(p.is_member, false)
                then (case when left(coalesce(p.avatar, ''), 4) = 'http' then p.avatar else coalesce(nullif(p.member_avatar, ''), p.avatar) end)
                else best.avatar end as avatar,
           best.level, best.score,
           coalesce(p.is_member, false) as member
    from best
    left join game_profiles p on p.player_hash = best.player_hash
    order by best.level desc, best.score desc, best.created_at asc
    limit least(greatest(coalesce(p_limit, 100), 1), 100)
  ) t;
$$;
grant execute on function game_leaderboard_period(text, text, int) to anon, authenticated, service_role;

-- V01D 멤버 보드 — 표시 이름/아바타 override
create or replace function game_member_board(p_mode text)
returns jsonb language plpgsql stable security definer set search_path = public, extensions as $$
declare
  v_wf timestamptz; v_wt timestamptz; v_mf timestamptz; v_mt timestamptz;
  m record;
  v_out jsonb := '[]'::jsonb;
  v_week jsonb; v_month jsonb;
begin
  select t_from, t_to into v_wf, v_wt from game_period_bounds('week');
  select t_from, t_to into v_mf, v_mt from game_period_bounds('month');

  for m in
    select player_hash,
           coalesce(nullif(member_name, ''), nickname) as nickname,
           case when left(coalesce(avatar, ''), 4) = 'http' then avatar else coalesce(nullif(member_avatar, ''), avatar) end as avatar
    from game_profiles where is_member order by coalesce(nullif(member_name, ''), nickname)
  loop
    select jsonb_build_object('rank', r.rank, 'level', r.level, 'score', r.score) into v_week from (
      with best as (select distinct on (player_hash) player_hash, level, score, created_at
        from game_scores where mode = p_mode and created_at >= v_wf and created_at < v_wt
        order by player_hash, level desc, score desc, created_at asc)
      select me.level, me.score,
             (select count(*) + 1 from best b where (b.level, b.score, -extract(epoch from b.created_at)) > (me.level, me.score, -extract(epoch from me.created_at)))::int as rank
      from best me where me.player_hash = m.player_hash) r;
    select jsonb_build_object('rank', r.rank, 'level', r.level, 'score', r.score) into v_month from (
      with best as (select distinct on (player_hash) player_hash, level, score, created_at
        from game_scores where mode = p_mode and created_at >= v_mf and created_at < v_mt
        order by player_hash, level desc, score desc, created_at asc)
      select me.level, me.score,
             (select count(*) + 1 from best b where (b.level, b.score, -extract(epoch from b.created_at)) > (me.level, me.score, -extract(epoch from me.created_at)))::int as rank
      from best me where me.player_hash = m.player_hash) r;

    v_out := v_out || jsonb_build_array(jsonb_build_object('nickname', m.nickname, 'avatar', m.avatar, 'week', v_week, 'month', v_month));
    v_week := null; v_month := null;
  end loop;
  return v_out;
end $$;
grant execute on function game_member_board(text) to anon, authenticated, service_role;

-- 관리자 상세 — member_name·member_avatar 포함(021 기반)
create or replace function admin_profile_detail(p_h text)
returns jsonb language sql security definer set search_path = public, extensions as $$
  select jsonb_build_object(
    'profile', (select row_to_json(p) from (
        select player_hash, nickname, avatar, created_at, last_login_at, is_member, member_name, member_avatar
        from game_profiles where player_hash = p_h) p),
    'celeb_point', (select coalesce(celeb_point, 0) from game_wallet where player_hash = p_h),
    'inventory', (select coalesce(jsonb_object_agg(item_type, qty), '{}'::jsonb) from game_inventory where player_hash = p_h),
    'best_normal', (select row_to_json(b) from (select level, score from game_scores where player_hash = p_h and mode = 'daily' order by level desc, score desc limit 1) b),
    'best_item', (select row_to_json(b) from (select level, score from game_scores where player_hash = p_h and mode = 'free' order by level desc, score desc limit 1) b),
    'scores_count', (select count(*) from game_scores where player_hash = p_h),
    'flagged_count', (select count(*) from game_scores where player_hash = p_h and flagged),
    'ledger', (select coalesce(jsonb_agg(row_to_json(l)), '[]'::jsonb) from (select delta, reason, created_at from game_point_ledger where player_hash = p_h order by created_at desc limit 20) l)
  );
$$;

-- 관리자: 멤버 표시 이름·아바타 저장
create or replace function admin_set_member_profile(p_h text, p_name text, p_avatar text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  update game_profiles
    set member_name = nullif(left(coalesce(p_name, ''), 40), ''),
        member_avatar = nullif(left(coalesce(p_avatar, ''), 500), '')
    where player_hash = p_h;
  if not found then return jsonb_build_object('error', 'not_found'); end if;
  return jsonb_build_object('ok', true);
end $$;
revoke execute on function admin_set_member_profile(text, text, text) from public, anon, authenticated;
grant  execute on function admin_set_member_profile(text, text, text) to service_role;
