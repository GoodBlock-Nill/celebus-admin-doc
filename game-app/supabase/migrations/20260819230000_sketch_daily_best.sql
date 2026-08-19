-- 047: 스케치 데일리 그림 퀴즈 + 주간 베스트 (2026-08-19 확정 — 장르 벤치마크 기반)
--   데일리: 전일 맞히기 성적 상위 5장 자동 선정 (재선정 영구 금지 — Drawception 규칙),
--   선정 작가 +20 CP, 전원 동일 5문제(KST), 완주 보너스 +10 CP (내 그림은 완주 요건에서 제외).
--   베스트: 지난주 데일리 선정작 중 최고 성적 1장 — 작가에게 드로우 티켓 1장, 명예의 전당 노출.
--   경쟁 랭킹 두 트랙(기획 §7 원안)은 장르 표준(노출·명예 보상)에 맞춰 본 구조로 대체.

create table if not exists game_sketch_daily (
  day date not null,
  slot int not null check (slot between 1 and 5),
  drawing_id uuid not null references game_sketch_drawing(id) on delete cascade,
  primary key (day, slot),
  unique (drawing_id) -- 재선정 영구 금지
);
create table if not exists game_sketch_daily_bonus (
  day date not null,
  player_hash text not null,
  primary key (day, player_hash)
);
create table if not exists game_sketch_weekly_best (
  week_start date primary key, -- 해당 주 월요일 (KST)
  drawing_id uuid not null references game_sketch_drawing(id) on delete cascade,
  correct_count int not null default 0
);
alter table game_sketch_daily enable row level security;
alter table game_sketch_daily_bonus enable row level security;
alter table game_sketch_weekly_best enable row level security;

-- 오늘 세트 확정 (게으른 구체화 — 첫 조회자가 채움, PK·unique로 경합 안전)
create or replace function game_sketch_daily_materialize()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_day date := (now() at time zone 'Asia/Seoul')::date;
  v_from timestamptz := ((v_day - 1)::timestamp) at time zone 'Asia/Seoul';
  v_to   timestamptz := (v_day::timestamp) at time zone 'Asia/Seoul';
  r record;
  v_slot int := 1;
begin
  if exists (select 1 from game_sketch_daily where day = v_day) then return; end if;

  -- 전일 성적 상위 → 부족하면 미선정 공개 그림 최신순으로 보충 (콜드스타트)
  for r in
    select d.id, d.player_hash
    from game_sketch_drawing d
    left join lateral (
      select count(*) filter (where g.correct) as y_correct, count(*) as y_done
      from game_sketch_guess g
      where g.drawing_id = d.id and g.done and g.updated_at >= v_from and g.updated_at < v_to
    ) s on true
    where d.status = 'approved'
      and not exists (select 1 from game_sketch_daily pk where pk.drawing_id = d.id)
    order by s.y_correct desc nulls last, s.y_done desc nulls last, d.created_at desc
    limit 5
  loop
    begin
      insert into game_sketch_daily (day, slot, drawing_id) values (v_day, v_slot, r.id);
    exception when unique_violation then
      continue; -- 동시 구체화 경합 — 다른 요청이 이미 채움
    end;
    -- 선정 작가 보상 (그림당 1회 — unique(drawing_id)가 보장)
    insert into game_wallet (player_hash, celeb_point) values (r.player_hash, 20)
      on conflict (player_hash) do update set celeb_point = game_wallet.celeb_point + excluded.celeb_point, updated_at = now();
    insert into game_point_ledger (player_hash, delta, reason) values (r.player_hash, 20, 'sketch:daily_pick');
    v_slot := v_slot + 1;
  end loop;
end $$;
revoke all on function game_sketch_daily_materialize() from public, anon, authenticated;

-- 완주 보너스 — 오늘 세트 중 "내 그림이 아닌 문제"를 전부 끝냈으면 +10 CP (1일 1회)
create or replace function game_sketch_daily_bonus_claim(p_h text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_day date := (now() at time zone 'Asia/Seoul')::date;
  v_remaining int;
  v_total int;
  v_bal int;
begin
  select count(*) into v_total from game_sketch_daily dd
    join game_sketch_drawing d on d.id = dd.drawing_id
   where dd.day = v_day and d.player_hash <> p_h;
  if v_total = 0 then return jsonb_build_object('error', 'no_quiz'); end if;

  select count(*) into v_remaining
  from game_sketch_daily dd
  join game_sketch_drawing d on d.id = dd.drawing_id
  where dd.day = v_day and d.player_hash <> p_h
    and not exists (select 1 from game_sketch_guess g where g.drawing_id = dd.drawing_id and g.player_hash = p_h and g.done);
  if v_remaining > 0 then return jsonb_build_object('error', 'not_done', 'remaining', v_remaining); end if;

  begin
    insert into game_sketch_daily_bonus (day, player_hash) values (v_day, p_h);
  exception when unique_violation then
    return jsonb_build_object('error', 'already_claimed');
  end;

  insert into game_wallet (player_hash, celeb_point) values (p_h, 10)
    on conflict (player_hash) do update set celeb_point = game_wallet.celeb_point + excluded.celeb_point, updated_at = now();
  insert into game_point_ledger (player_hash, delta, reason) values (p_h, 10, 'sketch:daily_bonus');
  select celeb_point into v_bal from game_wallet where player_hash = p_h;
  return jsonb_build_object('ok', true, 'cp', 10, 'celeb_point', coalesce(v_bal, 0));
end $$;
revoke all on function game_sketch_daily_bonus_claim(text) from public, anon, authenticated;

-- 지난주 베스트 확정 — 지난주 데일리 선정작 중 누적 정답 수 최고 1장, 작가에게 드로우 티켓 1장
create or replace function game_sketch_weekly_best_materialize()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_week date := date_trunc('week', (now() at time zone 'Asia/Seoul')::date - 7)::date; -- 지난주 월요일
  v_id uuid;
  v_owner text;
  v_correct int;
begin
  if exists (select 1 from game_sketch_weekly_best where week_start = v_week) then return; end if;

  select d.id, d.player_hash, d.correct_count into v_id, v_owner, v_correct
  from game_sketch_daily dd
  join game_sketch_drawing d on d.id = dd.drawing_id
  where dd.day >= v_week and dd.day < v_week + 7
  order by d.correct_count desc, d.guess_count desc, d.created_at asc
  limit 1;
  if v_id is null then return; end if; -- 지난주 데일리 없음 (초기)

  begin
    insert into game_sketch_weekly_best (week_start, drawing_id, correct_count) values (v_week, v_id, coalesce(v_correct, 0));
  exception when unique_violation then
    return;
  end;

  insert into game_gacha_wallet (player_hash, free_tickets) values (v_owner, 1)
    on conflict (player_hash) do update set free_tickets = game_gacha_wallet.free_tickets + excluded.free_tickets, updated_at = now();
end $$;
revoke all on function game_sketch_weekly_best_materialize() from public, anon, authenticated;
