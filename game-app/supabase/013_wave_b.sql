-- ─────────────────────────────────────────────────────────────
-- 013: Wave B — 주간 랭킹 보상 자동 지급 (lazy claim)
--  · 유저가 새 주에 첫 접속하면 지난주(KST 월~일) 모드별 최종 순위를 계산해 보상 CP 지급.
--  · 보상표 = game_config rewards.weeklyTop (배열, 인덱스=순위-1), 폴백 = 코드 기본.
--  · game_week_rewards PK(player, week, mode)로 중복 지급 원천 차단. 원장 reason 'weekly_reward:...'.
-- ─────────────────────────────────────────────────────────────

create table if not exists game_week_rewards (
  player_hash text not null,
  week_start  date not null,             -- 해당 주 월요일(KST)
  mode        text not null,             -- daily / free
  rank        int  not null,
  cp          int  not null,
  created_at  timestamptz not null default now(),
  primary key (player_hash, week_start, mode)
);
alter table game_week_rewards enable row level security; -- service_role 전용

create or replace function game_claim_week_reward(p_player_hash text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_week_start date := (date_trunc('week', now() at time zone 'Asia/Seoul'))::date - 7; -- 지난주 월요일
  v_from timestamptz := (v_week_start::timestamp) at time zone 'Asia/Seoul';
  v_to   timestamptz := ((v_week_start + 7)::timestamp) at time zone 'Asia/Seoul';
  v_table jsonb := coalesce(
    (select config -> 'rewards' -> 'weeklyTop' from game_config where id = 1),
    '[100,70,50,30,30,20,20,20,20,20]'::jsonb);
  r record;
  v_cp int; v_paid boolean; v_total int := 0;
  v_out jsonb := '{}'::jsonb;
  v_bal int;
begin
  for r in
    with best as (
      select distinct on (player_hash, mode) player_hash, mode, level, score, created_at
      from game_scores
      where created_at >= v_from and created_at < v_to
      order by player_hash, mode, level desc, score desc, created_at asc
    )
    select m.mode,
           (select count(*) + 1 from best b
             where b.mode = m.mode
               and (b.level, b.score, -extract(epoch from b.created_at)) > (m.level, m.score, -extract(epoch from m.created_at))) as rank
    from best m
    where m.player_hash = p_player_hash
  loop
    v_cp := coalesce((v_table ->> (r.rank - 1)::int)::int, 0); -- rank는 count()+1 = bigint → 인덱스 캐스팅 필수
    v_paid := false;
    if v_cp > 0 then
      begin
        insert into game_week_rewards (player_hash, week_start, mode, rank, cp)
        values (p_player_hash, v_week_start, r.mode, r.rank::int, v_cp);
        v_paid := true;
      exception when unique_violation then
        v_paid := false; -- 이미 지급된 주 — 재지급 없음
        v_cp := 0;
      end;
      if v_paid then
        insert into game_wallet (player_hash, celeb_point)
        values (p_player_hash, v_cp)
        on conflict (player_hash) do update
          set celeb_point = game_wallet.celeb_point + excluded.celeb_point, updated_at = now();
        insert into game_point_ledger (player_hash, delta, reason)
        values (p_player_hash, v_cp, 'weekly_reward:' || v_week_start || ':' || r.mode || ':rank' || r.rank);
        v_total := v_total + v_cp;
      end if;
    end if;
    v_out := v_out || jsonb_build_object(
      case when r.mode = 'daily' then 'normal' else 'item' end,
      jsonb_build_object('rank', r.rank, 'cp', v_cp, 'paid', v_paid));
  end loop;

  if v_out = '{}'::jsonb then
    return jsonb_build_object('has_result', false); -- 지난주 기록 없음
  end if;
  select celeb_point into v_bal from game_wallet where player_hash = p_player_hash;
  return jsonb_build_object(
    'has_result', true,
    'week_start', v_week_start,
    'rewards', v_out,
    'total_cp', v_total,
    'celeb_point', coalesce(v_bal, 0));
end $$;

revoke execute on function game_claim_week_reward(text) from public, anon, authenticated;
grant  execute on function game_claim_week_reward(text) to service_role;
