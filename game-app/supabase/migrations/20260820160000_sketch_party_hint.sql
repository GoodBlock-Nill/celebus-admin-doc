-- 051: 파티룸 힌트 — 비동기와 동일한 폭탄 방식 (더미 타일 제거, 10 CP·라운드당 1회)
create table if not exists game_sketch_room_hint (
  room_id uuid not null references game_sketch_room(id) on delete cascade,
  round int not null,
  player_hash text not null,
  primary key (room_id, round, player_hash)
);
alter table game_sketch_room_hint enable row level security;

create or replace function game_sketch_room_hint_exec(p_room uuid, p_h text, p_lang text default 'ko')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_room game_sketch_room;
  v_word jsonb;
  v_answer text;
  v_cost int := 10;
  v_point int;
begin
  select * into v_room from game_sketch_room where id = p_room;
  if v_room.id is null or v_room.status <> 'playing' then return jsonb_build_object('error', 'bad_room'); end if;
  if v_room.drawer_hash = p_h then return jsonb_build_object('error', 'drawer'); end if;
  if now() > v_room.round_deadline then return jsonb_build_object('error', 'round_over'); end if;
  if exists (select 1 from game_sketch_room_correct where room_id = p_room and round = v_room.round and player_hash = p_h) then
    return jsonb_build_object('error', 'already_correct');
  end if;

  select text into v_word from game_sketch_word where id = v_room.word_id;
  v_answer := coalesce(
    case p_lang
      when 'en' then v_word ->> 'en'
      when 'ja' then coalesce(v_word ->> 'ja_kana', v_word ->> 'ja')
      else v_word ->> 'ko' end,
    v_word ->> 'ko');

  if exists (select 1 from game_sketch_room_hint where room_id = p_room and round = v_room.round and player_hash = p_h) then
    return jsonb_build_object('status', 'ok', 'answer', v_answer, 'charged', 0); -- 재호출 무과금 (제거 인덱스 재계산용)
  end if;

  select celeb_point into v_point from game_wallet where player_hash = p_h for update;
  if coalesce(v_point, 0) < v_cost then return jsonb_build_object('error', 'insufficient'); end if;

  update game_wallet set celeb_point = celeb_point - v_cost, updated_at = now() where player_hash = p_h;
  insert into game_point_ledger (player_hash, delta, reason) values (p_h, -v_cost, 'sketch:party_hint');
  insert into game_sketch_room_hint (room_id, round, player_hash) values (p_room, v_room.round, p_h);

  return jsonb_build_object('status', 'ok', 'answer', v_answer, 'charged', v_cost);
end $$;
revoke all on function game_sketch_room_hint_exec(uuid, text, text) from public, anon, authenticated;
