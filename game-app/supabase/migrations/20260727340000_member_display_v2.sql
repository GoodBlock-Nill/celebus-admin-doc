-- 032: V01D 멤버 표시 개선 v2
--   ① 이름 다국어 병기 — 닉네임은 그대로 유지, 멤버 이름(ko/en/ja)을 닉네임 "옆에" 병기.
--   ② 아바타 파일 업로드 — member-avatars 스토리지 버킷에 업로드한 이미지 URL을 member_avatar에 저장.
--   표시 아바타 우선순위: CELEBUS 프로필 이미지(URL) > 관리자 업로드 이미지 > 기존 아바타.
alter table game_profiles add column if not exists member_name_en text; -- member_name = 한국어
alter table game_profiles add column if not exists member_name_ja text;

-- 멤버 아바타 업로드용 공개 버킷 (없으면 생성)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('member-avatars', 'member-avatars', true, 3145728, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

-- 멤버 이름(ko/en/ja) 객체 — 멤버이고 한국어 이름이 설정된 경우에만 반환, 아니면 null
create or replace function member_name_obj(p_ko text, p_en text, p_ja text) returns jsonb
language sql immutable as $$
  select case when p_ko is null or p_ko = '' then null else jsonb_build_object(
    'ko', p_ko,
    'en', coalesce(nullif(p_en, ''), p_ko),
    'ja', coalesce(nullif(p_ja, ''), p_ko)) end;
$$;

-- 기간 리더보드 — 닉네임 유지 + 멤버 이름 병기 + 아바타 override
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
           best.nickname,
           case when coalesce(p.is_member, false)
                then (case when left(coalesce(p.avatar, ''), 4) = 'http' then p.avatar else coalesce(nullif(p.member_avatar, ''), p.avatar) end)
                else best.avatar end as avatar,
           best.level, best.score,
           coalesce(p.is_member, false) as member,
           case when coalesce(p.is_member, false) then member_name_obj(p.member_name, p.member_name_en, p.member_name_ja) else null end as member_name
    from best
    left join game_profiles p on p.player_hash = best.player_hash
    order by best.level desc, best.score desc, best.created_at asc
    limit least(greatest(coalesce(p_limit, 100), 1), 100)
  ) t;
$$;
grant execute on function game_leaderboard_period(text, text, int) to anon, authenticated, service_role;

-- V01D 멤버 보드 — 닉네임 유지 + 멤버 이름 병기 + 아바타 override
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
    select player_hash, nickname,
           case when left(coalesce(avatar, ''), 4) = 'http' then avatar else coalesce(nullif(member_avatar, ''), avatar) end as avatar,
           member_name_obj(member_name, member_name_en, member_name_ja) as member_name
    from game_profiles where is_member order by nickname
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

    v_out := v_out || jsonb_build_array(jsonb_build_object('nickname', m.nickname, 'avatar', m.avatar, 'member_name', m.member_name, 'week', v_week, 'month', v_month));
    v_week := null; v_month := null;
  end loop;
  return v_out;
end $$;
grant execute on function game_member_board(text) to anon, authenticated, service_role;

-- 관리자 상세 — 멤버 이름(ko/en/ja)·아바타 포함
create or replace function admin_profile_detail(p_h text)
returns jsonb language sql security definer set search_path = public, extensions as $$
  select jsonb_build_object(
    'profile', (select row_to_json(p) from (
        select player_hash, nickname, avatar, created_at, last_login_at, is_member,
               member_name, member_name_en, member_name_ja, member_avatar
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

-- 관리자: 멤버 이름(ko/en/ja) 저장 (구 admin_set_member_profile 대체)
drop function if exists admin_set_member_profile(text, text, text);
create or replace function admin_set_member_names(p_h text, p_ko text, p_en text, p_ja text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  update game_profiles set
    member_name    = nullif(left(coalesce(p_ko, ''), 40), ''),
    member_name_en = nullif(left(coalesce(p_en, ''), 40), ''),
    member_name_ja = nullif(left(coalesce(p_ja, ''), 40), '')
    where player_hash = p_h;
  if not found then return jsonb_build_object('error', 'not_found'); end if;
  return jsonb_build_object('ok', true);
end $$;
revoke execute on function admin_set_member_names(text, text, text, text) from public, anon, authenticated;
grant  execute on function admin_set_member_names(text, text, text, text) to service_role;

-- 관리자: 멤버 아바타 URL 저장 (파일 업로드 후 공개 URL)
create or replace function admin_set_member_avatar(p_h text, p_url text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  update game_profiles set member_avatar = nullif(left(coalesce(p_url, ''), 500), '') where player_hash = p_h;
  if not found then return jsonb_build_object('error', 'not_found'); end if;
  return jsonb_build_object('ok', true);
end $$;
revoke execute on function admin_set_member_avatar(text, text) from public, anon, authenticated;
grant  execute on function admin_set_member_avatar(text, text) to service_role;
