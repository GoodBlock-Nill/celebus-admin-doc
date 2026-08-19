-- CELEB 스케치 W1 수직 슬라이스 — 제시어·그림(스트로크 로그)·맞히기 (기획 docs/minigame-celeb-sketch-plan.md §11 W1)
-- 원칙: 정답 판정은 서버 RPC(클라에 정답 평문 미전송, §8) · 그림 = 스트로크 벡터 로그(§2-2)
-- W1 범위 제외: 검수 큐(pending 상태만 예약, W2)·CP 보상(§7, W2)·신고(W2)

-- 제시어 카탈로그 (W2에서 관리자 편집 UI 연결 — 지금은 시드만)
create table if not exists game_sketch_word (
  id uuid primary key default gen_random_uuid(),
  text jsonb not null,                       -- {ko, en, ja}
  category text not null default 'common',   -- music(팬덤 훅) / common / hard
  difficulty int not null default 1,         -- 1~3 (★ 수)
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 유저 그림 — strokes = [{color, width, points:[{x,y,t}]}] 정규화 좌표 벡터 로그
create table if not exists game_sketch_drawing (
  id uuid primary key default gen_random_uuid(),
  player_hash text not null,
  word_id uuid not null references game_sketch_word(id),
  strokes jsonb not null,
  duration_ms int not null default 0,
  status text not null default 'approved',   -- W2 검수 큐 도입 시 기본 'pending'으로 전환
  guess_count int not null default 0,        -- 맞히기 종료(정답/소진) 인원 수
  correct_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_sketch_drawing_assign on game_sketch_drawing (status, guess_count, created_at desc);
create index if not exists idx_sketch_drawing_player on game_sketch_drawing (player_hash, created_at desc);

-- 맞히기 진행 — 유저×그림당 1행 (시도 3회, 정답/소진 시 done)
create table if not exists game_sketch_guess (
  drawing_id uuid not null references game_sketch_drawing(id) on delete cascade,
  player_hash text not null,
  tries int not null default 0,
  correct boolean not null default false,
  done boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (drawing_id, player_hash)
);

alter table game_sketch_word enable row level security;
alter table game_sketch_drawing enable row level security;
alter table game_sketch_guess enable row level security;
-- 정책 없음 = service_role 전용 (기존 관례)

-- 정답 판정 + 진행 갱신 — 원자적, 결과는 서버 단독 결정. 정답은 done 시점에만 공개
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

  return jsonb_build_object(
    'correct', v_correct,
    'tries', v_tries,
    'tries_left', greatest(0, 3 - v_tries),
    'done', v_done,
    'word', case when v_done then v_word ->> 'ko' else null end
  );
end $$;
revoke all on function game_sketch_guess_exec(text, uuid, text) from public, anon, authenticated;

-- 제시어 시드 30종 (ko/en/ja) — W1 검증용 최소 볼륨 (런칭 300개는 W2)
insert into game_sketch_word (text, category, difficulty) values
  ('{"ko":"기타","en":"guitar","ja":"ギター"}', 'music', 1),
  ('{"ko":"드럼","en":"drum","ja":"ドラム"}', 'music', 1),
  ('{"ko":"마이크","en":"microphone","ja":"マイク"}', 'music', 1),
  ('{"ko":"응원봉","en":"light stick","ja":"ペンライト"}', 'music', 2),
  ('{"ko":"무대","en":"stage","ja":"ステージ"}', 'music', 2),
  ('{"ko":"앵콜","en":"encore","ja":"アンコール"}', 'music', 3),
  ('{"ko":"피아노","en":"piano","ja":"ピアノ"}', 'music', 1),
  ('{"ko":"헤드폰","en":"headphones","ja":"ヘッドホン"}', 'music', 1),
  ('{"ko":"우산","en":"umbrella","ja":"傘"}', 'common', 1),
  ('{"ko":"라면","en":"ramen","ja":"ラーメン"}', 'common', 1),
  ('{"ko":"지하철","en":"subway","ja":"地下鉄"}', 'common', 2),
  ('{"ko":"케이크","en":"cake","ja":"ケーキ"}', 'common', 1),
  ('{"ko":"안경","en":"glasses","ja":"メガネ"}', 'common', 1),
  ('{"ko":"커피","en":"coffee","ja":"コーヒー"}', 'common', 1),
  ('{"ko":"시계","en":"clock","ja":"時計"}', 'common', 1),
  ('{"ko":"카메라","en":"camera","ja":"カメラ"}', 'common', 1),
  ('{"ko":"풍선","en":"balloon","ja":"風船"}', 'common', 1),
  ('{"ko":"왕관","en":"crown","ja":"王冠"}', 'common', 2),
  ('{"ko":"기차","en":"train","ja":"電車"}', 'common', 1),
  ('{"ko":"눈사람","en":"snowman","ja":"雪だるま"}', 'common', 1),
  ('{"ko":"로켓","en":"rocket","ja":"ロケット"}', 'common', 1),
  ('{"ko":"고래","en":"whale","ja":"クジラ"}', 'nature', 1),
  ('{"ko":"무지개","en":"rainbow","ja":"虹"}', 'nature', 1),
  ('{"ko":"달","en":"moon","ja":"月"}', 'nature', 1),
  ('{"ko":"바다","en":"sea","ja":"海"}', 'nature', 2),
  ('{"ko":"별","en":"star","ja":"星"}', 'nature', 1),
  ('{"ko":"꽃","en":"flower","ja":"花"}', 'nature', 1),
  ('{"ko":"나비","en":"butterfly","ja":"チョウ"}', 'nature', 1),
  ('{"ko":"하트","en":"heart","ja":"ハート"}', 'common', 1),
  ('{"ko":"춤","en":"dance","ja":"ダンス"}', 'hard', 3)
on conflict do nothing;
