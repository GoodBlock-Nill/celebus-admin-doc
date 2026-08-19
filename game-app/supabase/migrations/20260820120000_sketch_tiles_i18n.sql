-- 049: 타일 시스템 3언어 전면 개선 (2026-08-19 사용자 지적 — 영어·일본어 유저가 맞출 수 없는 타일)
--   ① 일본어 가나 읽기(ja_kana) 데이터 — 한자·라틴 포함 단어 전부. 가나만인 단어는 클라 빌더가 ja 그대로 사용
--   ② 판정 RPC에 p_lang 추가: ja_kana 비교 포함 + 정답 공개를 유저 언어로
--   ③ 힌트 RPC에 p_lang 추가: 첫 글자를 유저 언어로

-- ── ja_kana 부여 (text jsonb 병합) ──
create or replace function _sk_kana(p_ko text, p_kana text) returns void language sql as $$
  update game_sketch_word set text = text || jsonb_build_object('ja_kana', p_kana) where text ->> 'ko' = p_ko;
$$;

select _sk_kana('우산','カサ'); select _sk_kana('지하철','チカテツ'); select _sk_kana('시계','トケイ');
select _sk_kana('풍선','フウセン'); select _sk_kana('왕관','オウカン'); select _sk_kana('기차','デンシャ');
select _sk_kana('눈사람','ユキダルマ'); select _sk_kana('무지개','ニジ'); select _sk_kana('달','ツキ');
select _sk_kana('바다','ウミ'); select _sk_kana('별','ホシ'); select _sk_kana('꽃','ハナ');
select _sk_kana('조명','ショウメイ'); select _sk_kana('자전거','ジテンシャ'); select _sk_kana('비행기','ヒコウキ');
select _sk_kana('신호등','シンゴウ'); select _sk_kana('학교','ガッコウ'); select _sk_kana('병원','ビョウイン');
select _sk_kana('의자','イス'); select _sk_kana('열쇠','カギ'); select _sk_kana('연필','エンピツ');
select _sk_kana('책','ホン'); select _sk_kana('모자','ボウシ'); select _sk_kana('양말','クツシタ');
select _sk_kana('장갑','テブクロ'); select _sk_kana('치약','ハミガキコ'); select _sk_kana('거울','カガミ');
select _sk_kana('냉장고','レイゾウコ'); select _sk_kana('세탁기','センタクキ'); select _sk_kana('강아지','コイヌ');
select _sk_kana('고양이','ネコ'); select _sk_kana('공룡','キョウリュウ'); select _sk_kana('화산','カザン');
select _sk_kana('번개','カミナリ'); select _sk_kana('눈','ユキ'); select _sk_kana('구름','クモ');
select _sk_kana('지각','チコク'); select _sk_kana('부끄러움','ハズカシサ'); select _sk_kana('생일','タンジョウビ');
select _sk_kana('여행','リョコウ'); select _sk_kana('꿈','ユメ');
select _sk_kana('젓가락','ハシ'); select _sk_kana('접시','サラ'); select _sk_kana('냄비','ナベ');
select _sk_kana('전자레인지','デンシレンジ'); select _sk_kana('밥솥','スイハンキ'); select _sk_kana('컵라면','カップメン');
select _sk_kana('만두','ギョウザ'); select _sk_kana('붕어빵','タイヤキ'); select _sk_kana('우유','ギュウニュウ');
select _sk_kana('도시락','オベントウ'); select _sk_kana('티셔츠','ティーシャツ'); select _sk_kana('가방','カバン');
select _sk_kana('지갑','サイフ'); select _sk_kana('반지','ユビワ'); select _sk_kana('장화','ナガグツ');
select _sk_kana('소방차','ショウボウシャ'); select _sk_kana('구급차','キュウキュウシャ'); select _sk_kana('열기구','キキュウ');
select _sk_kana('잠수함','センスイカン'); select _sk_kana('우주선','ウチュウセン'); select _sk_kana('우주인','ウチュウヒコウシ');
select _sk_kana('인공위성','ジンコウエイセイ'); select _sk_kana('조개','カイ'); select _sk_kana('모기','カ');
select _sk_kana('소','ウシ'); select _sk_kana('말','ウマ'); select _sk_kana('양','ヒツジ');
select _sk_kana('나무','キ'); select _sk_kana('소나무','マツ'); select _sk_kana('네잎클로버','ヨツバノクローバー');
select _sk_kana('고추','トウガラシ'); select _sk_kana('산','ヤマ'); select _sk_kana('폭포','タキ');
select _sk_kana('섬','シマ'); select _sk_kana('사막','サバク'); select _sk_kana('동굴','ドウクツ');
select _sk_kana('빙산','ヒョウザン'); select _sk_kana('등대','トウダイ'); select _sk_kana('다리','ハシ');
select _sk_kana('성','シロ'); select _sk_kana('태양','タイヨウ'); select _sk_kana('노을','ユウヤケ');
select _sk_kana('유성','ナガレボシ'); select _sk_kana('지구','チキュウ'); select _sk_kana('토성','ドセイ');
select _sk_kana('모닥불','タキビ'); select _sk_kana('낚싯대','ツリザオ'); select _sk_kana('미끄럼틀','スベリダイ');
select _sk_kana('볼링핀','ボウリングノピン'); select _sk_kana('줄넘기','ナワトビ'); select _sk_kana('깃발','ハタ');
select _sk_kana('곰인형','クマノヌイグルミ'); select _sk_kana('연','タコ'); select _sk_kana('풍차','カザグルマ');
select _sk_kana('전구','デンキュウ'); select _sk_kana('손전등','カイチュウデントウ'); select _sk_kana('자석','ジシャク');
select _sk_kana('돋보기','ムシメガネ'); select _sk_kana('망원경','ボウエンキョウ'); select _sk_kana('지도','チズ');
select _sk_kana('나침반','ホウイジシン'); select _sk_kana('지구본','チキュウギ'); select _sk_kana('편지봉투','フウトウ');
select _sk_kana('우표','キッテ'); select _sk_kana('신문','シンブン'); select _sk_kana('붓','フデ');
select _sk_kana('물감','エノグ'); select _sk_kana('향수','コウスイ'); select _sk_kana('칫솔','ハブラシ');
select _sk_kana('비누','セッケン'); select _sk_kana('욕조','ヨクソウ'); select _sk_kana('웃음','ワライ');
select _sk_kana('울음','ナキ'); select _sk_kana('박수','ハクシュ'); select _sk_kana('악수','アクシュ');
select _sk_kana('수영','スイエイ'); select _sk_kana('낚시','ツリ'); select _sk_kana('등산','トザン');
select _sk_kana('요리','リョウリ'); select _sk_kana('청소','ソウジ'); select _sk_kana('빨래','センタク');
select _sk_kana('공부','ベンキョウ'); select _sk_kana('잠','スイミン'); select _sk_kana('감기','カゼ');
select _sk_kana('주사','チュウシャ'); select _sk_kana('붕대','ホウタイ'); select _sk_kana('체온계','タイオンケイ');
select _sk_kana('청진기','チョウシンキ'); select _sk_kana('반창고','バンソウコウ'); select _sk_kana('숟가락','スプーン');

drop function _sk_kana(text, text);

-- ── 판정 v3 — p_lang: ja_kana 비교 + 정답 공개를 유저 언어로 ──
drop function if exists game_sketch_guess_exec(text, uuid, text);
create or replace function game_sketch_guess_exec(p_h text, p_drawing uuid, p_answer text, p_lang text default 'ko')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_word jsonb;
  v_owner text;
  v_row game_sketch_guess;
  v_norm text;
  v_correct boolean;
  v_tries int;
  v_done boolean;
  v_guesser_cp int := 5;
  v_artist_cp int := 3;
  v_point int;
  v_reveal text;
begin
  select w.text, d.player_hash into v_word, v_owner
    from game_sketch_drawing d join game_sketch_word w on w.id = d.word_id
   where d.id = p_drawing and d.status = 'approved';
  if v_word is null then return jsonb_build_object('error', 'bad_drawing'); end if;
  if v_owner = p_h then return jsonb_build_object('error', 'own_drawing'); end if;

  v_reveal := coalesce(
    case p_lang when 'en' then v_word ->> 'en' when 'ja' then coalesce(v_word ->> 'ja', v_word ->> 'ja_kana') else v_word ->> 'ko' end,
    v_word ->> 'ko');

  insert into game_sketch_guess (drawing_id, player_hash) values (p_drawing, p_h)
    on conflict (drawing_id, player_hash) do nothing;
  select * into v_row from game_sketch_guess where drawing_id = p_drawing and player_hash = p_h for update;
  if v_row.done then
    return jsonb_build_object('error', 'already_done', 'word', v_reveal);
  end if;

  v_norm := replace(lower(trim(p_answer)), ' ', '');
  v_correct := v_norm <> '' and (
    v_norm = replace(lower(trim(coalesce(v_word ->> 'ko', ''))), ' ', '') or
    v_norm = replace(lower(trim(coalesce(v_word ->> 'en', ''))), ' ', '') or
    v_norm = replace(lower(trim(coalesce(v_word ->> 'ja', ''))), ' ', '') or
    v_norm = replace(lower(trim(coalesce(v_word ->> 'ja_kana', ''))), ' ', '')
  );
  v_tries := v_row.tries + 1;
  v_done := v_correct or v_tries >= 3;

  update game_sketch_guess
     set tries = v_tries, correct = v_correct, done = v_done, updated_at = now()
   where drawing_id = p_drawing and player_hash = p_h;

  if v_done then
    update game_sketch_drawing
       set guess_count = guess_count + 1,
           correct_count = correct_count + (case when v_correct then 1 else 0 end)
     where id = p_drawing;
  end if;

  if v_correct then
    insert into game_wallet (player_hash, celeb_point) values (p_h, v_guesser_cp)
      on conflict (player_hash) do update set celeb_point = game_wallet.celeb_point + excluded.celeb_point, updated_at = now();
    insert into game_point_ledger (player_hash, delta, reason) values (p_h, v_guesser_cp, 'sketch:guess');
    insert into game_wallet (player_hash, celeb_point) values (v_owner, v_artist_cp)
      on conflict (player_hash) do update set celeb_point = game_wallet.celeb_point + excluded.celeb_point, updated_at = now();
    insert into game_point_ledger (player_hash, delta, reason) values (v_owner, v_artist_cp, 'sketch:artist');
  end if;
  select celeb_point into v_point from game_wallet where player_hash = p_h;

  return jsonb_build_object(
    'correct', v_correct,
    'tries', v_tries,
    'tries_left', greatest(0, 3 - v_tries),
    'done', v_done,
    'word', case when v_done then v_reveal else null end,
    'cp_awarded', case when v_correct then v_guesser_cp else 0 end,
    'celeb_point', coalesce(v_point, 0)
  );
end $$;
revoke all on function game_sketch_guess_exec(text, uuid, text, text) from public, anon, authenticated;

-- ── 힌트 v2 — 유저 언어의 첫 글자 ──
drop function if exists game_sketch_hint_exec(text, uuid);
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
    return jsonb_build_object('status', 'ok', 'first', substr(replace(v_answer, ' ', ''), 1, 1), 'charged', 0);
  end if;

  select celeb_point into v_point from game_wallet where player_hash = p_h for update;
  if coalesce(v_point, 0) < v_cost then return jsonb_build_object('error', 'insufficient'); end if;

  update game_wallet set celeb_point = celeb_point - v_cost, updated_at = now() where player_hash = p_h;
  insert into game_point_ledger (player_hash, delta, reason) values (p_h, -v_cost, 'sketch:hint');
  update game_sketch_guess set hint = true, updated_at = now() where drawing_id = p_drawing and player_hash = p_h;

  return jsonb_build_object('status', 'ok', 'first', substr(replace(v_answer, ' ', ''), 1, 1), 'charged', v_cost,
    'celeb_point', coalesce(v_point, 0) - v_cost);
end $$;
revoke all on function game_sketch_hint_exec(text, uuid, text) from public, anon, authenticated;

-- ── 파티 판정 v2 — ja_kana 비교 + 정답 공개 언어화 ──
drop function if exists game_sketch_room_guess(uuid, text, text);
create or replace function game_sketch_room_guess(p_room uuid, p_h text, p_answer text, p_lang text default 'ko')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_room game_sketch_room;
  v_word jsonb;
  v_norm text;
  v_correct boolean;
  v_points int;
  v_elapsed int;
  v_remaining int;
  v_reveal text;
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
  v_reveal := coalesce(
    case p_lang when 'en' then v_word ->> 'en' when 'ja' then coalesce(v_word ->> 'ja', v_word ->> 'ja_kana') else v_word ->> 'ko' end,
    v_word ->> 'ko');
  v_norm := replace(lower(trim(p_answer)), ' ', '');
  v_correct := v_norm <> '' and (
    v_norm = replace(lower(trim(coalesce(v_word ->> 'ko', ''))), ' ', '') or
    v_norm = replace(lower(trim(coalesce(v_word ->> 'en', ''))), ' ', '') or
    v_norm = replace(lower(trim(coalesce(v_word ->> 'ja', ''))), ' ', '') or
    v_norm = replace(lower(trim(coalesce(v_word ->> 'ja_kana', ''))), ' ', ''));
  if not v_correct then return jsonb_build_object('correct', false); end if;

  v_elapsed := extract(epoch from (now() - v_room.round_started_at))::int;
  v_points := greatest(10, 100 - v_elapsed);
  begin
    insert into game_sketch_room_correct (room_id, round, player_hash, points) values (p_room, v_room.round, p_h, v_points);
  exception when unique_violation then
    return jsonb_build_object('error', 'already_correct');
  end;
  update game_sketch_room_member set score = score + v_points where room_id = p_room and player_hash = p_h;
  update game_sketch_room_member set score = score + 20 where room_id = p_room and player_hash = v_room.drawer_hash;

  select count(*) into v_remaining
  from game_sketch_room_member m
  where m.room_id = p_room and m.player_hash <> v_room.drawer_hash
    and not exists (select 1 from game_sketch_room_correct c where c.room_id = p_room and c.round = v_room.round and c.player_hash = m.player_hash);

  return jsonb_build_object('correct', true, 'points', v_points, 'all_done', v_remaining = 0, 'word', v_reveal);
end $$;
revoke all on function game_sketch_room_guess(uuid, text, text, text) from public, anon, authenticated;
