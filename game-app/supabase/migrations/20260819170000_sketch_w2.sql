-- CELEB 스케치 W2 — AI 1차 검수 + 신고 임계 자동 비공개 + CP 보상·힌트 (2026-08-19 사용자 확정안)
-- 검수 흐름: 제출(pending) → AI 판정 → approved(공개)/held(보류 큐)/rejected. AI 장애·키 부재 = held 폴백.
-- 신고: 신규 출제자 그림 2회·신뢰 출제자(승인 10장+) 5회 누적 시 자동 hidden (Drawception 검증 모델).
-- 보상: 정답자 +5 CP·출제자 +3 CP(상호 보상 §3) / 힌트(첫 글자) -10 CP. 전부 서버 권위 + 원장 기록.

-- 상태 확장 — 기존 approved 기본값을 pending으로 (제출 API가 AI 판정 결과로 명시 설정)
alter table game_sketch_drawing alter column status set default 'pending';
alter table game_sketch_drawing add column if not exists ai_verdict jsonb;
alter table game_sketch_drawing add column if not exists report_count int not null default 0;
alter table game_sketch_drawing add column if not exists hidden_at timestamptz;
alter table game_sketch_drawing add column if not exists moderated_at timestamptz; -- 관리자 수동 처리 시각

alter table game_sketch_guess add column if not exists hint boolean not null default false;

-- 신고 — 유저×그림당 1회, 사유 2종(부적절/글자 반칙)
create table if not exists game_sketch_report (
  drawing_id uuid not null references game_sketch_drawing(id) on delete cascade,
  player_hash text not null,
  reason text not null check (reason in ('inappropriate', 'letters')),
  created_at timestamptz not null default now(),
  primary key (drawing_id, player_hash)
);
alter table game_sketch_report enable row level security;

-- 신고 접수 + 임계 자동 비공개
create or replace function game_sketch_report_exec(p_h text, p_drawing uuid, p_reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_owner text;
  v_count int;
  v_threshold int;
  v_trusted boolean;
begin
  select player_hash into v_owner from game_sketch_drawing where id = p_drawing;
  if v_owner is null then return jsonb_build_object('error', 'bad_drawing'); end if;
  if v_owner = p_h then return jsonb_build_object('error', 'own_drawing'); end if;

  insert into game_sketch_report (drawing_id, player_hash, reason) values (p_drawing, p_h, p_reason)
    on conflict (drawing_id, player_hash) do nothing;

  select count(*) into v_count from game_sketch_report where drawing_id = p_drawing;
  -- 신뢰 출제자 = 승인 그림 10장 이상 + 자동 비공개 이력 없음
  v_trusted := (select count(*) from game_sketch_drawing where player_hash = v_owner and status = 'approved') >= 10
    and not exists (select 1 from game_sketch_drawing where player_hash = v_owner and hidden_at is not null);
  v_threshold := case when v_trusted then 5 else 2 end;

  update game_sketch_drawing set report_count = v_count where id = p_drawing;
  if v_count >= v_threshold then
    update game_sketch_drawing set status = 'hidden', hidden_at = now()
     where id = p_drawing and status = 'approved';
  end if;
  return jsonb_build_object('status', 'ok', 'count', v_count, 'hidden', v_count >= v_threshold);
end $$;
revoke all on function game_sketch_report_exec(text, uuid, text) from public, anon, authenticated;

-- 판정 v2 — 정답 시 상호 보상 CP 지급 (정답자 +5 · 출제자 +3, 원장 기록)
create or replace function game_sketch_guess_exec(p_h text, p_drawing uuid, p_answer text)
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
begin
  select w.text, d.player_hash into v_word, v_owner
    from game_sketch_drawing d join game_sketch_word w on w.id = d.word_id
   where d.id = p_drawing and d.status = 'approved';
  if v_word is null then return jsonb_build_object('error', 'bad_drawing'); end if;
  if v_owner = p_h then return jsonb_build_object('error', 'own_drawing'); end if;

  insert into game_sketch_guess (drawing_id, player_hash) values (p_drawing, p_h)
    on conflict (drawing_id, player_hash) do nothing;
  select * into v_row from game_sketch_guess where drawing_id = p_drawing and player_hash = p_h for update;
  if v_row.done then
    return jsonb_build_object('error', 'already_done', 'word', v_word ->> 'ko');
  end if;

  v_norm := replace(lower(trim(p_answer)), ' ', '');
  v_correct := v_norm <> '' and (
    v_norm = replace(lower(trim(coalesce(v_word ->> 'ko', ''))), ' ', '') or
    v_norm = replace(lower(trim(coalesce(v_word ->> 'en', ''))), ' ', '') or
    v_norm = replace(lower(trim(coalesce(v_word ->> 'ja', ''))), ' ', '')
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
    -- 상호 보상 (§3) — 맞힌 사람과 그린 사람이 함께 얻는다
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
    'word', case when v_done then v_word ->> 'ko' else null end,
    'cp_awarded', case when v_correct then v_guesser_cp else 0 end,
    'celeb_point', coalesce(v_point, 0)
  );
end $$;
revoke all on function game_sketch_guess_exec(text, uuid, text) from public, anon, authenticated;

-- 힌트 — 첫 글자 공개, 10 CP 소모 (그림당 1회, 잔액 부족 거부)
create or replace function game_sketch_hint_exec(p_h text, p_drawing uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_word text;
  v_owner text;
  v_row game_sketch_guess;
  v_cost int := 10;
  v_point int;
begin
  select w.text ->> 'ko', d.player_hash into v_word, v_owner
    from game_sketch_drawing d join game_sketch_word w on w.id = d.word_id
   where d.id = p_drawing and d.status = 'approved';
  if v_word is null then return jsonb_build_object('error', 'bad_drawing'); end if;
  if v_owner = p_h then return jsonb_build_object('error', 'own_drawing'); end if;

  insert into game_sketch_guess (drawing_id, player_hash) values (p_drawing, p_h)
    on conflict (drawing_id, player_hash) do nothing;
  select * into v_row from game_sketch_guess where drawing_id = p_drawing and player_hash = p_h for update;
  if v_row.done then return jsonb_build_object('error', 'already_done'); end if;
  if v_row.hint then
    return jsonb_build_object('status', 'ok', 'first', substr(replace(v_word, ' ', ''), 1, 1), 'charged', 0);
  end if;

  select celeb_point into v_point from game_wallet where player_hash = p_h for update;
  if coalesce(v_point, 0) < v_cost then return jsonb_build_object('error', 'insufficient'); end if;

  update game_wallet set celeb_point = celeb_point - v_cost, updated_at = now() where player_hash = p_h;
  insert into game_point_ledger (player_hash, delta, reason) values (p_h, -v_cost, 'sketch:hint');
  update game_sketch_guess set hint = true, updated_at = now() where drawing_id = p_drawing and player_hash = p_h;

  return jsonb_build_object('status', 'ok', 'first', substr(replace(v_word, ' ', ''), 1, 1), 'charged', v_cost,
    'celeb_point', coalesce(v_point, 0) - v_cost);
end $$;
revoke all on function game_sketch_hint_exec(text, uuid) from public, anon, authenticated;

-- 제시어 확장 +60 (총 90) — 런칭 300은 운영 등록으로 지속 확장
insert into game_sketch_word (text, category, difficulty) values
  ('{"ko":"베이스","en":"bass","ja":"ベース"}', 'music', 2),
  ('{"ko":"키보드","en":"keyboard","ja":"キーボード"}', 'music', 1),
  ('{"ko":"콘서트","en":"concert","ja":"コンサート"}', 'music', 2),
  ('{"ko":"팬레터","en":"fan letter","ja":"ファンレター"}', 'music', 2),
  ('{"ko":"포스터","en":"poster","ja":"ポスター"}', 'music', 1),
  ('{"ko":"티켓","en":"ticket","ja":"チケット"}', 'music', 1),
  ('{"ko":"조명","en":"spotlight","ja":"照明"}', 'music', 2),
  ('{"ko":"스피커","en":"speaker","ja":"スピーカー"}', 'music', 1),
  ('{"ko":"녹음실","en":"studio","ja":"スタジオ"}', 'music', 3),
  ('{"ko":"댄스","en":"dance","ja":"ダンス"}', 'music', 3),
  ('{"ko":"사과","en":"apple","ja":"リンゴ"}', 'common', 1),
  ('{"ko":"바나나","en":"banana","ja":"バナナ"}', 'common', 1),
  ('{"ko":"수박","en":"watermelon","ja":"スイカ"}', 'common', 1),
  ('{"ko":"피자","en":"pizza","ja":"ピザ"}', 'common', 1),
  ('{"ko":"햄버거","en":"hamburger","ja":"ハンバーガー"}', 'common', 1),
  ('{"ko":"아이스크림","en":"ice cream","ja":"アイスクリーム"}', 'common', 1),
  ('{"ko":"김밥","en":"gimbap","ja":"キンパ"}', 'common', 1),
  ('{"ko":"떡볶이","en":"tteokbokki","ja":"トッポッキ"}', 'common', 2),
  ('{"ko":"자전거","en":"bicycle","ja":"自転車"}', 'common', 1),
  ('{"ko":"버스","en":"bus","ja":"バス"}', 'common', 1),
  ('{"ko":"비행기","en":"airplane","ja":"飛行機"}', 'common', 1),
  ('{"ko":"신호등","en":"traffic light","ja":"信号"}', 'common', 1),
  ('{"ko":"학교","en":"school","ja":"学校"}', 'common', 2),
  ('{"ko":"병원","en":"hospital","ja":"病院"}', 'common', 2),
  ('{"ko":"침대","en":"bed","ja":"ベッド"}', 'common', 1),
  ('{"ko":"의자","en":"chair","ja":"椅子"}', 'common', 1),
  ('{"ko":"우체통","en":"mailbox","ja":"ポスト"}', 'common', 2),
  ('{"ko":"열쇠","en":"key","ja":"鍵"}', 'common', 1),
  ('{"ko":"가위","en":"scissors","ja":"ハサミ"}', 'common', 1),
  ('{"ko":"연필","en":"pencil","ja":"鉛筆"}', 'common', 1),
  ('{"ko":"책","en":"book","ja":"本"}', 'common', 1),
  ('{"ko":"모자","en":"hat","ja":"帽子"}', 'common', 1),
  ('{"ko":"양말","en":"socks","ja":"靴下"}', 'common', 1),
  ('{"ko":"운동화","en":"sneakers","ja":"スニーカー"}', 'common', 1),
  ('{"ko":"목도리","en":"scarf","ja":"マフラー"}', 'common', 1),
  ('{"ko":"장갑","en":"gloves","ja":"手袋"}', 'common', 1),
  ('{"ko":"치약","en":"toothpaste","ja":"歯磨き粉"}', 'common', 2),
  ('{"ko":"거울","en":"mirror","ja":"鏡"}', 'common', 2),
  ('{"ko":"텔레비전","en":"television","ja":"テレビ"}', 'common', 1),
  ('{"ko":"냉장고","en":"refrigerator","ja":"冷蔵庫"}', 'common', 1),
  ('{"ko":"세탁기","en":"washing machine","ja":"洗濯機"}', 'common', 2),
  ('{"ko":"강아지","en":"puppy","ja":"子犬"}', 'nature', 1),
  ('{"ko":"고양이","en":"cat","ja":"猫"}', 'nature', 1),
  ('{"ko":"토끼","en":"rabbit","ja":"ウサギ"}', 'nature', 1),
  ('{"ko":"펭귄","en":"penguin","ja":"ペンギン"}', 'nature', 1),
  ('{"ko":"코끼리","en":"elephant","ja":"ゾウ"}', 'nature', 1),
  ('{"ko":"기린","en":"giraffe","ja":"キリン"}', 'nature', 1),
  ('{"ko":"거북이","en":"turtle","ja":"カメ"}', 'nature', 1),
  ('{"ko":"문어","en":"octopus","ja":"タコ"}', 'nature', 1),
  ('{"ko":"공룡","en":"dinosaur","ja":"恐竜"}', 'nature', 1),
  ('{"ko":"선인장","en":"cactus","ja":"サボテン"}', 'nature', 1),
  ('{"ko":"화산","en":"volcano","ja":"火山"}', 'nature', 2),
  ('{"ko":"번개","en":"lightning","ja":"雷"}', 'nature', 1),
  ('{"ko":"눈","en":"snow","ja":"雪"}', 'nature', 2),
  ('{"ko":"구름","en":"cloud","ja":"雲"}', 'nature', 1),
  ('{"ko":"지각","en":"being late","ja":"遅刻"}', 'hard', 3),
  ('{"ko":"부끄러움","en":"shyness","ja":"恥ずかしさ"}', 'hard', 3),
  ('{"ko":"생일","en":"birthday","ja":"誕生日"}', 'hard', 2),
  ('{"ko":"여행","en":"travel","ja":"旅行"}', 'hard', 3),
  ('{"ko":"꿈","en":"dream","ja":"夢"}', 'hard', 3)
on conflict do nothing;
