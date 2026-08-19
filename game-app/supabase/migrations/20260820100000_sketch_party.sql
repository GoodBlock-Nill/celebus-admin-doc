-- 048: CELEB SKETCH W3 파티룸 — 초대 링크 실시간 방 (기획 §5.5, 공통 멀티 전략 원칙①)
--   구조: 방·멤버·라운드 상태는 DB가 권위 (RPC로만 변경) / 스트로크 중계·프레즌스는 Realtime 채널(휘발).
--   점수: 빨리 맞힐수록 가산(100 - 경과초, 최소 10) + 출제자는 맞힌 인원당 +20. 주간 랭킹 미반영(§5.5 담합 방지).
--   라운드 수 = 시작 시점 인원 × 2 (최대 16). 90초 제한, 전원 정답 시 조기 종료. 출제자 무응답은 방장 스킵.

create table if not exists game_sketch_room (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                 -- 초대 코드 (6자)
  host_hash text not null,
  status text not null default 'lobby',      -- lobby / playing / ended
  round int not null default 0,
  total_rounds int not null default 0,
  drawer_hash text,
  word_id uuid references game_sketch_word(id),
  round_started_at timestamptz,
  round_deadline timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists game_sketch_room_member (
  room_id uuid not null references game_sketch_room(id) on delete cascade,
  player_hash text not null,
  nickname text not null default '',
  score int not null default 0,
  joined_at timestamptz not null default now(),
  primary key (room_id, player_hash)
);
create table if not exists game_sketch_room_correct (
  room_id uuid not null,
  round int not null,
  player_hash text not null,
  points int not null default 0,
  created_at timestamptz not null default now(),
  primary key (room_id, round, player_hash)
);
alter table game_sketch_room enable row level security;
alter table game_sketch_room_member enable row level security;
alter table game_sketch_room_correct enable row level security;

-- 방 개설
create or replace function game_sketch_room_create(p_h text, p_nick text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_id uuid;
begin
  v_code := upper(substr(md5(gen_random_uuid()::text), 1, 6));
  insert into game_sketch_room (code, host_hash) values (v_code, p_h) returning id into v_id;
  insert into game_sketch_room_member (room_id, player_hash, nickname) values (v_id, p_h, coalesce(p_nick, ''));
  return jsonb_build_object('id', v_id, 'code', v_code);
end $$;

-- 입장 (정원 8, 진행 중에도 재입장 허용 — 기존 멤버면 통과)
create or replace function game_sketch_room_join(p_code text, p_h text, p_nick text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_room game_sketch_room;
  v_members int;
begin
  select * into v_room from game_sketch_room where code = upper(p_code);
  if v_room.id is null then return jsonb_build_object('error', 'not_found'); end if;
  if v_room.status = 'ended' then return jsonb_build_object('error', 'ended'); end if;
  if exists (select 1 from game_sketch_room_member where room_id = v_room.id and player_hash = p_h) then
    return jsonb_build_object('id', v_room.id, 'code', v_room.code, 'rejoined', true);
  end if;
  if v_room.status <> 'lobby' then return jsonb_build_object('error', 'in_progress'); end if; -- 신규 입장은 로비만
  select count(*) into v_members from game_sketch_room_member where room_id = v_room.id;
  if v_members >= 8 then return jsonb_build_object('error', 'full'); end if;
  insert into game_sketch_room_member (room_id, player_hash, nickname) values (v_room.id, p_h, coalesce(p_nick, ''));
  return jsonb_build_object('id', v_room.id, 'code', v_room.code);
end $$;

-- 다음 라운드 세팅 (내부 공용) — 출제자 로테이션 + 미사용 제시어 배정
create or replace function game_sketch_room_setup_round(p_room uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_room game_sketch_room;
  v_drawer text;
  v_word uuid;
begin
  select * into v_room from game_sketch_room where id = p_room;
  -- 로테이션: 참가 순서 기준 round번째 멤버
  select player_hash into v_drawer from game_sketch_room_member
   where room_id = p_room order by joined_at
   offset ((v_room.round - 1) % (select count(*) from game_sketch_room_member where room_id = p_room)) limit 1;
  select id into v_word from game_sketch_word where active order by random() limit 1;
  update game_sketch_room
     set drawer_hash = v_drawer, word_id = v_word,
         round_started_at = now(), round_deadline = now() + interval '90 seconds', updated_at = now()
   where id = p_room;
end $$;

-- 시작 (방장 전용, 2인 이상)
create or replace function game_sketch_room_start(p_room uuid, p_h text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_room game_sketch_room;
  v_members int;
begin
  select * into v_room from game_sketch_room where id = p_room for update;
  if v_room.id is null or v_room.host_hash <> p_h then return jsonb_build_object('error', 'not_host'); end if;
  if v_room.status <> 'lobby' then return jsonb_build_object('error', 'bad_status'); end if;
  select count(*) into v_members from game_sketch_room_member where room_id = p_room;
  if v_members < 2 then return jsonb_build_object('error', 'need_more'); end if;
  update game_sketch_room set status = 'playing', round = 1, total_rounds = least(16, v_members * 2), updated_at = now()
   where id = p_room;
  perform game_sketch_room_setup_round(p_room);
  return jsonb_build_object('ok', true);
end $$;

-- 정답 시도 — 서버 판정 + 속도 가산 점수 (출제자 +20/명). 전원 정답 시 라운드 조기 종료 신호
create or replace function game_sketch_room_guess(p_room uuid, p_h text, p_answer text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_room game_sketch_room;
  v_word jsonb;
  v_norm text;
  v_correct boolean;
  v_points int;
  v_elapsed int;
  v_remaining int;
begin
  select * into v_room from game_sketch_room where id = p_room;
  if v_room.id is null or v_room.status <> 'playing' then return jsonb_build_object('error', 'bad_room'); end if;
  if v_room.drawer_hash = p_h then return jsonb_build_object('error', 'drawer'); end if;
  if now() > v_room.round_deadline then return jsonb_build_object('error', 'round_over'); end if;
  if not exists (select 1 from game_sketch_room_member where room_id = p_room and player_hash = p_h) then
    return jsonb_build_object('error', 'not_member');
  end if;
  if exists (select 1 from game_sketch_room_correct where room_id = p_room and round = v_room.round and player_hash = p_h) then
    return jsonb_build_object('error', 'already_correct');
  end if;

  select text into v_word from game_sketch_word where id = v_room.word_id;
  v_norm := replace(lower(trim(p_answer)), ' ', '');
  v_correct := v_norm <> '' and (
    v_norm = replace(lower(trim(coalesce(v_word ->> 'ko', ''))), ' ', '') or
    v_norm = replace(lower(trim(coalesce(v_word ->> 'en', ''))), ' ', '') or
    v_norm = replace(lower(trim(coalesce(v_word ->> 'ja', ''))), ' ', ''));
  if not v_correct then return jsonb_build_object('correct', false); end if;

  v_elapsed := extract(epoch from (now() - v_room.round_started_at))::int;
  v_points := greatest(10, 100 - v_elapsed);
  begin
    insert into game_sketch_room_correct (room_id, round, player_hash, points) values (p_room, v_room.round, p_h, v_points);
  exception when unique_violation then
    return jsonb_build_object('error', 'already_correct');
  end;
  update game_sketch_room_member set score = score + v_points where room_id = p_room and player_hash = p_h;
  update game_sketch_room_member set score = score + 20 where room_id = p_room and player_hash = v_room.drawer_hash; -- 상호 보상

  select count(*) into v_remaining
  from game_sketch_room_member m
  where m.room_id = p_room and m.player_hash <> v_room.drawer_hash
    and not exists (select 1 from game_sketch_room_correct c where c.room_id = p_room and c.round = v_room.round and c.player_hash = m.player_hash);

  return jsonb_build_object('correct', true, 'points', v_points, 'all_done', v_remaining = 0, 'word', v_word ->> 'ko');
end $$;

-- 라운드 진행 — 마감(시간 초과·전원 정답) 후 다음 라운드 or 종료. 방장 스킵(출제자 무응답)도 이 경로 (p_force)
create or replace function game_sketch_room_advance(p_room uuid, p_h text, p_force boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_room game_sketch_room;
  v_remaining int;
begin
  select * into v_room from game_sketch_room where id = p_room for update;
  if v_room.id is null or v_room.status <> 'playing' then return jsonb_build_object('error', 'bad_room'); end if;
  if p_force and v_room.host_hash <> p_h then return jsonb_build_object('error', 'not_host'); end if;

  if not p_force and now() <= v_room.round_deadline then
    select count(*) into v_remaining
    from game_sketch_room_member m
    where m.room_id = p_room and m.player_hash <> v_room.drawer_hash
      and not exists (select 1 from game_sketch_room_correct c where c.room_id = p_room and c.round = v_room.round and c.player_hash = m.player_hash);
    if v_remaining > 0 then return jsonb_build_object('error', 'not_over'); end if;
  end if;

  if v_room.round >= v_room.total_rounds then
    update game_sketch_room set status = 'ended', updated_at = now() where id = p_room;
    return jsonb_build_object('ended', true);
  end if;
  update game_sketch_room set round = round + 1, updated_at = now() where id = p_room;
  perform game_sketch_room_setup_round(p_room);
  return jsonb_build_object('ok', true, 'round', v_room.round + 1);
end $$;

revoke all on function game_sketch_room_create(text, text) from public, anon, authenticated;
revoke all on function game_sketch_room_join(text, text, text) from public, anon, authenticated;
revoke all on function game_sketch_room_setup_round(uuid) from public, anon, authenticated;
revoke all on function game_sketch_room_start(uuid, text) from public, anon, authenticated;
revoke all on function game_sketch_room_guess(uuid, text, text) from public, anon, authenticated;
revoke all on function game_sketch_room_advance(uuid, text, boolean) from public, anon, authenticated;
