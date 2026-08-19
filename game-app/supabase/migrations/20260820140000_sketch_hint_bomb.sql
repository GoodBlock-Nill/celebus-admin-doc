-- 050: 힌트 개편 — "첫 글자 공개" → "더미 타일 제거" (2026-08-19 사용자 버그 지적)
--   한 글자 정답(연·달·별…)에서 첫 글자 = 정답 전체가 그대로 공개되던 결함.
--   Draw Something 폭탄 방식으로 전환: 서버는 정답 문자열만 반환(서비스 롤 전용 — 클라 미전송),
--   API 라우트가 유저의 타일 세트에서 더미를 골라 제거 인덱스만 내려준다. 과금·1회 제한은 기존 유지.
drop function if exists game_sketch_hint_exec(text, uuid, text);
create or replace function game_sketch_hint_exec(p_h text, p_drawing uuid, p_lang text default 'ko')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_word jsonb;
  v_answer text;
  v_owner text;
  v_row game_sketch_guess;
  v_cost int := 10;
  v_point int;
begin
  select w.text, d.player_hash into v_word, v_owner
    from game_sketch_drawing d join game_sketch_word w on w.id = d.word_id
   where d.id = p_drawing and d.status = 'approved';
  if v_word is null then return jsonb_build_object('error', 'bad_drawing'); end if;
  if v_owner = p_h then return jsonb_build_object('error', 'own_drawing'); end if;

  v_answer := coalesce(
    case p_lang
      when 'en' then v_word ->> 'en'
      when 'ja' then coalesce(v_word ->> 'ja_kana', v_word ->> 'ja')
      else v_word ->> 'ko' end,
    v_word ->> 'ko');

  insert into game_sketch_guess (drawing_id, player_hash) values (p_drawing, p_h)
    on conflict (drawing_id, player_hash) do nothing;
  select * into v_row from game_sketch_guess where drawing_id = p_drawing and player_hash = p_h for update;
  if v_row.done then return jsonb_build_object('error', 'already_done'); end if;
  if v_row.hint then
    -- 이미 사용 — 재과금 없이 정답만 반환 (라우트가 제거 인덱스 재계산)
    return jsonb_build_object('status', 'ok', 'answer', v_answer, 'charged', 0);
  end if;

  select celeb_point into v_point from game_wallet where player_hash = p_h for update;
  if coalesce(v_point, 0) < v_cost then return jsonb_build_object('error', 'insufficient'); end if;

  update game_wallet set celeb_point = celeb_point - v_cost, updated_at = now() where player_hash = p_h;
  insert into game_point_ledger (player_hash, delta, reason) values (p_h, -v_cost, 'sketch:hint');
  update game_sketch_guess set hint = true, updated_at = now() where drawing_id = p_drawing and player_hash = p_h;

  return jsonb_build_object('status', 'ok', 'answer', v_answer, 'charged', v_cost,
    'celeb_point', coalesce(v_point, 0) - v_cost);
end $$;
revoke all on function game_sketch_hint_exec(text, uuid, text) from public, anon, authenticated;
