-- 046: 스케치 미션 편입 + 제시어 300 완성 (기획 §7 — W2 콘텐츠)
--   미션 풀 +2종: sketch_draw(오늘 그림 제출 수, 반려 제외) · sketch_guess(오늘 정답 수)
--   기존 로테이션 구조 그대로 — 풀 8종에서 매일 count종 선택. 관리자 폼·검증도 클라에서 확장.

create or replace function game_mission_status(p_h text)
returns jsonb
language plpgsql stable security definer set search_path = public, extensions as $$
declare
  v_day  date := (now() at time zone 'Asia/Seoul')::date;
  v_from timestamptz := (v_day::timestamp) at time zone 'Asia/Seoul';
  v_cfg  jsonb := coalesce((select config -> 'missions' from game_config where id = 1), '{}'::jsonb);
  v_pool jsonb := coalesce(v_cfg -> 'pool', '[
    {"id":"plays","goal":3,"cp":20},{"id":"score","goal":2000,"cp":20},{"id":"level","goal":3,"cp":30},
    {"id":"high","goal":1500,"cp":20},{"id":"item","goal":2,"cp":20},{"id":"normal","goal":2,"cp":20},
    {"id":"sketch_draw","goal":1,"cp":20},{"id":"sketch_guess","goal":3,"cp":20}]'::jsonb);
  v_count int := coalesce((v_cfg ->> 'count')::int, 3);
  v_plays int; v_score int; v_level int; v_high int; v_item int; v_normal int;
  v_sk_draw int; v_sk_guess int;
  v_out jsonb := '[]'::jsonb;
  r record; v_val int;
begin
  select count(*), coalesce(sum(score), 0), coalesce(max(level), 0), coalesce(max(score), 0),
         count(*) filter (where mode = 'free'), count(*) filter (where mode = 'daily')
  into v_plays, v_score, v_level, v_high, v_item, v_normal
  from game_scores where player_hash = p_h and created_at >= v_from;

  select count(*) into v_sk_draw
  from game_sketch_drawing where player_hash = p_h and created_at >= v_from and status <> 'rejected';
  select count(*) into v_sk_guess
  from game_sketch_guess where player_hash = p_h and correct and updated_at >= v_from;

  for r in
    select (e ->> 'id') as id, coalesce((e ->> 'goal')::int, 1) as goal, coalesce((e ->> 'cp')::int, 10) as cp
    from jsonb_array_elements(v_pool) e
    order by md5(v_day::text || (e ->> 'id')) limit greatest(v_count, 1)
  loop
    v_val := case r.id
      when 'plays' then v_plays when 'score' then v_score when 'level' then v_level
      when 'high' then v_high when 'item' then v_item when 'normal' then v_normal
      when 'sketch_draw' then v_sk_draw when 'sketch_guess' then v_sk_guess else 0 end;
    v_out := v_out || jsonb_build_array(jsonb_build_object(
      'id', r.id, 'value', v_val, 'goal', r.goal, 'cp', r.cp,
      'claimed', exists (select 1 from game_mission_claim where player_hash = p_h and day = v_day and mission = r.id)));
  end loop;

  -- 하위호환 레거시 키 유지 (구 클라이언트)
  return jsonb_build_object('day', v_day, 'missions', v_out,
    'plays', jsonb_build_object('value', v_plays,
      'goal', coalesce((v_cfg->'legacy'->>'plays')::int, 3), 'cp', coalesce((v_cfg->'legacy'->>'playsCp')::int, 20),
      'claimed', exists (select 1 from game_mission_claim where player_hash = p_h and day = v_day and mission = 'plays')),
    'score', jsonb_build_object('value', v_score,
      'goal', coalesce((v_cfg->'legacy'->>'totalScore')::int, 2000), 'cp', coalesce((v_cfg->'legacy'->>'scoreCp')::int, 20),
      'claimed', exists (select 1 from game_mission_claim where player_hash = p_h and day = v_day and mission = 'score')),
    'level', jsonb_build_object('value', v_level,
      'goal', coalesce((v_cfg->'legacy'->>'bestLevel')::int, 3), 'cp', coalesce((v_cfg->'legacy'->>'levelCp')::int, 30),
      'claimed', exists (select 1 from game_mission_claim where player_hash = p_h and day = v_day and mission = 'level')));
end $$;

create or replace function game_mission_claim_reward(p_h text, p_mission text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_day  date := (now() at time zone 'Asia/Seoul')::date;
  v_from timestamptz := (v_day::timestamp) at time zone 'Asia/Seoul';
  v_cfg  jsonb := coalesce((select config -> 'missions' from game_config where id = 1), '{}'::jsonb);
  v_pool jsonb := coalesce(v_cfg -> 'pool', '[
    {"id":"plays","goal":3,"cp":20},{"id":"score","goal":2000,"cp":20},{"id":"level","goal":3,"cp":30},
    {"id":"high","goal":1500,"cp":20},{"id":"item","goal":2,"cp":20},{"id":"normal","goal":2,"cp":20},
    {"id":"sketch_draw","goal":1,"cp":20},{"id":"sketch_guess","goal":3,"cp":20}]'::jsonb);
  v_count int := coalesce((v_cfg ->> 'count')::int, 3);
  v_goal int; v_cp int; v_val int; v_bal int;
begin
  select coalesce((e ->> 'goal')::int, 1), coalesce((e ->> 'cp')::int, 10)
  into v_goal, v_cp
  from (
    select e from jsonb_array_elements(v_pool) e
    order by md5(v_day::text || (e ->> 'id')) limit greatest(v_count, 1)
  ) s(e)
  where (e ->> 'id') = p_mission;

  if not found and p_mission in ('plays', 'score', 'level') then
    select coalesce((e ->> 'goal')::int, 1), coalesce((e ->> 'cp')::int, 10)
    into v_goal, v_cp
    from jsonb_array_elements(v_pool) e where (e ->> 'id') = p_mission;
  end if;
  if v_goal is null then return jsonb_build_object('error', 'bad_mission'); end if;

  v_val := case p_mission
    when 'plays'  then (select count(*)::int from game_scores where player_hash = p_h and created_at >= v_from)
    when 'score'  then (select coalesce(sum(score), 0)::int from game_scores where player_hash = p_h and created_at >= v_from)
    when 'level'  then (select coalesce(max(level), 0)::int from game_scores where player_hash = p_h and created_at >= v_from)
    when 'high'   then (select coalesce(max(score), 0)::int from game_scores where player_hash = p_h and created_at >= v_from)
    when 'item'   then (select count(*)::int from game_scores where player_hash = p_h and created_at >= v_from and mode = 'free')
    when 'normal' then (select count(*)::int from game_scores where player_hash = p_h and created_at >= v_from and mode = 'daily')
    when 'sketch_draw'  then (select count(*)::int from game_sketch_drawing where player_hash = p_h and created_at >= v_from and status <> 'rejected')
    when 'sketch_guess' then (select count(*)::int from game_sketch_guess where player_hash = p_h and correct and updated_at >= v_from)
    else 0 end;

  if v_val < v_goal then return jsonb_build_object('error', 'not_achieved'); end if;

  begin
    insert into game_mission_claim (player_hash, day, mission, cp) values (p_h, v_day, p_mission, v_cp);
  exception when unique_violation then
    return jsonb_build_object('error', 'already_claimed');
  end;

  insert into game_wallet (player_hash, celeb_point) values (p_h, v_cp)
  on conflict (player_hash) do update
    set celeb_point = game_wallet.celeb_point + excluded.celeb_point, updated_at = now();
  insert into game_point_ledger (player_hash, delta, reason)
  values (p_h, v_cp, 'mission:' || v_day || ':' || p_mission);

  select celeb_point into v_bal from game_wallet where player_hash = p_h;
  return jsonb_build_object('ok', true, 'cp', v_cp, 'celeb_point', coalesce(v_bal, 0));
end $$;

revoke execute on function game_mission_status(text) from public, anon, authenticated;
revoke execute on function game_mission_claim_reward(text, text) from public, anon, authenticated;
grant  execute on function game_mission_status(text) to service_role;
grant  execute on function game_mission_claim_reward(text, text) to service_role;

-- 제시어 +210 (총 300 목표, 3언어) — 브랜드명·실존 인물 배제 (기획 §4.2)
insert into game_sketch_word (text, category, difficulty) values
  ('{"ko":"탬버린","en":"tambourine","ja":"タンバリン"}', 'music', 1),
  ('{"ko":"트라이앵글","en":"triangle","ja":"トライアングル"}', 'music', 1),
  ('{"ko":"하모니카","en":"harmonica","ja":"ハーモニカ"}', 'music', 2),
  ('{"ko":"바이올린","en":"violin","ja":"バイオリン"}', 'music', 1),
  ('{"ko":"첼로","en":"cello","ja":"チェロ"}', 'music', 2),
  ('{"ko":"트럼펫","en":"trumpet","ja":"トランペット"}', 'music', 1),
  ('{"ko":"색소폰","en":"saxophone","ja":"サックス"}', 'music', 2),
  ('{"ko":"플루트","en":"flute","ja":"フルート"}', 'music', 2),
  ('{"ko":"실로폰","en":"xylophone","ja":"シロフォン"}', 'music', 1),
  ('{"ko":"음표","en":"music note","ja":"音符"}', 'music', 1),
  ('{"ko":"악보","en":"sheet music","ja":"楽譜"}', 'music', 2),
  ('{"ko":"이어폰","en":"earphones","ja":"イヤホン"}', 'music', 1),
  ('{"ko":"레코드판","en":"vinyl record","ja":"レコード"}', 'music', 1),
  ('{"ko":"라디오","en":"radio","ja":"ラジオ"}', 'music', 1),
  ('{"ko":"노래방","en":"karaoke","ja":"カラオケ"}', 'music', 3),
  ('{"ko":"팬미팅","en":"fan meeting","ja":"ファンミーティング"}', 'music', 3),
  ('{"ko":"사인","en":"autograph","ja":"サイン"}', 'music', 2),
  ('{"ko":"셀카","en":"selfie","ja":"自撮り"}', 'music', 2),
  ('{"ko":"손하트","en":"finger heart","ja":"指ハート"}', 'music', 1),
  ('{"ko":"하이파이브","en":"high five","ja":"ハイタッチ"}', 'music', 2),
  ('{"ko":"숟가락","en":"spoon","ja":"スプーン"}', 'common', 1),
  ('{"ko":"젓가락","en":"chopsticks","ja":"箸"}', 'common', 1),
  ('{"ko":"포크","en":"fork","ja":"フォーク"}', 'common', 1),
  ('{"ko":"접시","en":"plate","ja":"皿"}', 'common', 1),
  ('{"ko":"컵","en":"cup","ja":"コップ"}', 'common', 1),
  ('{"ko":"주전자","en":"kettle","ja":"やかん"}', 'common', 1),
  ('{"ko":"냄비","en":"pot","ja":"鍋"}', 'common', 1),
  ('{"ko":"프라이팬","en":"frying pan","ja":"フライパン"}', 'common', 1),
  ('{"ko":"국자","en":"ladle","ja":"おたま"}', 'common', 2),
  ('{"ko":"전자레인지","en":"microwave","ja":"電子レンジ"}', 'common', 2),
  ('{"ko":"밥솥","en":"rice cooker","ja":"炊飯器"}', 'common', 2),
  ('{"ko":"컵라면","en":"cup noodles","ja":"カップ麺"}', 'common', 1),
  ('{"ko":"만두","en":"dumpling","ja":"餃子"}', 'common', 1),
  ('{"ko":"치킨","en":"fried chicken","ja":"フライドチキン"}', 'common', 1),
  ('{"ko":"감자튀김","en":"french fries","ja":"フライドポテト"}', 'common', 1),
  ('{"ko":"핫도그","en":"hot dog","ja":"ホットドッグ"}', 'common', 1),
  ('{"ko":"샌드위치","en":"sandwich","ja":"サンドイッチ"}', 'common', 1),
  ('{"ko":"도넛","en":"donut","ja":"ドーナツ"}', 'common', 1),
  ('{"ko":"마카롱","en":"macaron","ja":"マカロン"}', 'common', 2),
  ('{"ko":"붕어빵","en":"fish-shaped bread","ja":"たい焼き"}', 'common', 2),
  ('{"ko":"솜사탕","en":"cotton candy","ja":"わたあめ"}', 'common', 1),
  ('{"ko":"팝콘","en":"popcorn","ja":"ポップコーン"}', 'common', 1),
  ('{"ko":"초콜릿","en":"chocolate","ja":"チョコレート"}', 'common', 1),
  ('{"ko":"사탕","en":"candy","ja":"キャンディ"}', 'common', 1),
  ('{"ko":"우유","en":"milk","ja":"牛乳"}', 'common', 1),
  ('{"ko":"주스","en":"juice","ja":"ジュース"}', 'common', 1),
  ('{"ko":"빨대","en":"straw","ja":"ストロー"}', 'common', 2),
  ('{"ko":"도시락","en":"lunch box","ja":"お弁当"}', 'common', 2),
  ('{"ko":"티셔츠","en":"t-shirt","ja":"Tシャツ"}', 'common', 1),
  ('{"ko":"바지","en":"pants","ja":"ズボン"}', 'common', 1),
  ('{"ko":"치마","en":"skirt","ja":"スカート"}', 'common', 1),
  ('{"ko":"원피스","en":"dress","ja":"ワンピース"}', 'common', 1),
  ('{"ko":"코트","en":"coat","ja":"コート"}', 'common', 2),
  ('{"ko":"넥타이","en":"necktie","ja":"ネクタイ"}', 'common', 1),
  ('{"ko":"벨트","en":"belt","ja":"ベルト"}', 'common', 1),
  ('{"ko":"가방","en":"bag","ja":"かばん"}', 'common', 1),
  ('{"ko":"배낭","en":"backpack","ja":"リュック"}', 'common', 1),
  ('{"ko":"지갑","en":"wallet","ja":"財布"}', 'common', 2),
  ('{"ko":"반지","en":"ring","ja":"指輪"}', 'common', 1),
  ('{"ko":"목걸이","en":"necklace","ja":"ネックレス"}', 'common', 1),
  ('{"ko":"귀걸이","en":"earrings","ja":"イヤリング"}', 'common', 1),
  ('{"ko":"팔찌","en":"bracelet","ja":"ブレスレット"}', 'common', 2),
  ('{"ko":"부츠","en":"boots","ja":"ブーツ"}', 'common', 1),
  ('{"ko":"하이힐","en":"high heels","ja":"ハイヒール"}', 'common', 1),
  ('{"ko":"슬리퍼","en":"slippers","ja":"スリッパ"}', 'common', 1),
  ('{"ko":"장화","en":"rain boots","ja":"長靴"}', 'common', 1),
  ('{"ko":"리본","en":"ribbon","ja":"リボン"}', 'common', 1),
  ('{"ko":"단추","en":"button","ja":"ボタン"}', 'common', 2),
  ('{"ko":"트럭","en":"truck","ja":"トラック"}', 'common', 1),
  ('{"ko":"소방차","en":"fire truck","ja":"消防車"}', 'common', 1),
  ('{"ko":"경찰차","en":"police car","ja":"パトカー"}', 'common', 1),
  ('{"ko":"구급차","en":"ambulance","ja":"救急車"}', 'common', 2),
  ('{"ko":"택시","en":"taxi","ja":"タクシー"}', 'common', 1),
  ('{"ko":"오토바이","en":"motorcycle","ja":"バイク"}', 'common', 1),
  ('{"ko":"킥보드","en":"kick scooter","ja":"キックボード"}', 'common', 1),
  ('{"ko":"헬리콥터","en":"helicopter","ja":"ヘリコプター"}', 'common', 1),
  ('{"ko":"열기구","en":"hot air balloon","ja":"気球"}', 'common', 1),
  ('{"ko":"요트","en":"yacht","ja":"ヨット"}', 'common', 1),
  ('{"ko":"잠수함","en":"submarine","ja":"潜水艦"}', 'common', 2),
  ('{"ko":"로봇","en":"robot","ja":"ロボット"}', 'common', 1),
  ('{"ko":"우주선","en":"spaceship","ja":"宇宙船"}', 'common', 1),
  ('{"ko":"우주인","en":"astronaut","ja":"宇宙飛行士"}', 'common', 2),
  ('{"ko":"인공위성","en":"satellite","ja":"人工衛星"}', 'common', 3),
  ('{"ko":"크레인","en":"crane truck","ja":"クレーン"}', 'common', 2),
  ('{"ko":"포클레인","en":"excavator","ja":"ショベルカー"}', 'common', 2),
  ('{"ko":"사자","en":"lion","ja":"ライオン"}', 'nature', 1),
  ('{"ko":"호랑이","en":"tiger","ja":"トラ"}', 'nature', 1),
  ('{"ko":"곰","en":"bear","ja":"クマ"}', 'nature', 1),
  ('{"ko":"판다","en":"panda","ja":"パンダ"}', 'nature', 1),
  ('{"ko":"여우","en":"fox","ja":"キツネ"}', 'nature', 1),
  ('{"ko":"늑대","en":"wolf","ja":"オオカミ"}', 'nature', 2),
  ('{"ko":"사슴","en":"deer","ja":"シカ"}', 'nature', 1),
  ('{"ko":"다람쥐","en":"squirrel","ja":"リス"}', 'nature', 1),
  ('{"ko":"햄스터","en":"hamster","ja":"ハムスター"}', 'nature', 1),
  ('{"ko":"고슴도치","en":"hedgehog","ja":"ハリネズミ"}', 'nature', 1),
  ('{"ko":"부엉이","en":"owl","ja":"フクロウ"}', 'nature', 1),
  ('{"ko":"독수리","en":"eagle","ja":"ワシ"}', 'nature', 2),
  ('{"ko":"오리","en":"duck","ja":"アヒル"}', 'nature', 1),
  ('{"ko":"닭","en":"chicken","ja":"ニワトリ"}', 'nature', 1),
  ('{"ko":"병아리","en":"chick","ja":"ヒヨコ"}', 'nature', 1),
  ('{"ko":"공작새","en":"peacock","ja":"クジャク"}', 'nature', 2),
  ('{"ko":"플라밍고","en":"flamingo","ja":"フラミンゴ"}', 'nature', 1),
  ('{"ko":"앵무새","en":"parrot","ja":"オウム"}', 'nature', 1),
  ('{"ko":"비둘기","en":"pigeon","ja":"ハト"}', 'nature', 2),
  ('{"ko":"갈매기","en":"seagull","ja":"カモメ"}', 'nature', 2),
  ('{"ko":"박쥐","en":"bat","ja":"コウモリ"}', 'nature', 1),
  ('{"ko":"개구리","en":"frog","ja":"カエル"}', 'nature', 1),
  ('{"ko":"뱀","en":"snake","ja":"ヘビ"}', 'nature', 1),
  ('{"ko":"악어","en":"crocodile","ja":"ワニ"}', 'nature', 1),
  ('{"ko":"상어","en":"shark","ja":"サメ"}', 'nature', 1),
  ('{"ko":"돌고래","en":"dolphin","ja":"イルカ"}', 'nature', 1),
  ('{"ko":"게","en":"crab","ja":"カニ"}', 'nature', 1),
  ('{"ko":"새우","en":"shrimp","ja":"エビ"}', 'nature', 1),
  ('{"ko":"오징어","en":"squid","ja":"イカ"}', 'nature', 1),
  ('{"ko":"불가사리","en":"starfish","ja":"ヒトデ"}', 'nature', 1),
  ('{"ko":"해파리","en":"jellyfish","ja":"クラゲ"}', 'nature', 1),
  ('{"ko":"조개","en":"seashell","ja":"貝"}', 'nature', 1),
  ('{"ko":"달팽이","en":"snail","ja":"カタツムリ"}', 'nature', 1),
  ('{"ko":"개미","en":"ant","ja":"アリ"}', 'nature', 1),
  ('{"ko":"벌","en":"bee","ja":"ハチ"}', 'nature', 1),
  ('{"ko":"잠자리","en":"dragonfly","ja":"トンボ"}', 'nature', 1),
  ('{"ko":"무당벌레","en":"ladybug","ja":"テントウムシ"}', 'nature', 1),
  ('{"ko":"거미","en":"spider","ja":"クモ"}', 'nature', 1),
  ('{"ko":"모기","en":"mosquito","ja":"蚊"}', 'nature', 2),
  ('{"ko":"소","en":"cow","ja":"牛"}', 'nature', 1),
  ('{"ko":"돼지","en":"pig","ja":"ブタ"}', 'nature', 1),
  ('{"ko":"말","en":"horse","ja":"馬"}', 'nature', 1),
  ('{"ko":"양","en":"sheep","ja":"羊"}', 'nature', 1),
  ('{"ko":"염소","en":"goat","ja":"ヤギ"}', 'nature', 2),
  ('{"ko":"낙타","en":"camel","ja":"ラクダ"}', 'nature', 1),
  ('{"ko":"캥거루","en":"kangaroo","ja":"カンガルー"}', 'nature', 1),
  ('{"ko":"코알라","en":"koala","ja":"コアラ"}', 'nature', 1),
  ('{"ko":"원숭이","en":"monkey","ja":"サル"}', 'nature', 1),
  ('{"ko":"고릴라","en":"gorilla","ja":"ゴリラ"}', 'nature', 1),
  ('{"ko":"하마","en":"hippo","ja":"カバ"}', 'nature', 1),
  ('{"ko":"코뿔소","en":"rhino","ja":"サイ"}', 'nature', 2),
  ('{"ko":"얼룩말","en":"zebra","ja":"シマウマ"}', 'nature', 1),
  ('{"ko":"나무","en":"tree","ja":"木"}', 'nature', 1),
  ('{"ko":"소나무","en":"pine tree","ja":"松"}', 'nature', 2),
  ('{"ko":"야자수","en":"palm tree","ja":"ヤシの木"}', 'nature', 1),
  ('{"ko":"단풍잎","en":"maple leaf","ja":"もみじ"}', 'nature', 1),
  ('{"ko":"네잎클로버","en":"four-leaf clover","ja":"四つ葉のクローバー"}', 'nature', 1),
  ('{"ko":"장미","en":"rose","ja":"バラ"}', 'nature', 1),
  ('{"ko":"해바라기","en":"sunflower","ja":"ひまわり"}', 'nature', 1),
  ('{"ko":"튤립","en":"tulip","ja":"チューリップ"}', 'nature', 1),
  ('{"ko":"버섯","en":"mushroom","ja":"キノコ"}', 'nature', 1),
  ('{"ko":"당근","en":"carrot","ja":"ニンジン"}', 'nature', 1),
  ('{"ko":"오이","en":"cucumber","ja":"キュウリ"}', 'nature', 2),
  ('{"ko":"토마토","en":"tomato","ja":"トマト"}', 'nature', 1),
  ('{"ko":"옥수수","en":"corn","ja":"トウモロコシ"}', 'nature', 1),
  ('{"ko":"양파","en":"onion","ja":"タマネギ"}', 'nature', 2),
  ('{"ko":"고추","en":"chili pepper","ja":"唐辛子"}', 'nature', 1),
  ('{"ko":"브로콜리","en":"broccoli","ja":"ブロッコリー"}', 'nature', 1),
  ('{"ko":"호박","en":"pumpkin","ja":"カボチャ"}', 'nature', 1),
  ('{"ko":"딸기","en":"strawberry","ja":"イチゴ"}', 'nature', 1),
  ('{"ko":"포도","en":"grapes","ja":"ブドウ"}', 'nature', 1),
  ('{"ko":"복숭아","en":"peach","ja":"モモ"}', 'nature', 1),
  ('{"ko":"귤","en":"tangerine","ja":"みかん"}', 'nature', 2),
  ('{"ko":"레몬","en":"lemon","ja":"レモン"}', 'nature', 1),
  ('{"ko":"체리","en":"cherry","ja":"さくらんぼ"}', 'nature', 1),
  ('{"ko":"파인애플","en":"pineapple","ja":"パイナップル"}', 'nature', 1),
  ('{"ko":"키위","en":"kiwi","ja":"キウイ"}', 'nature', 2),
  ('{"ko":"산","en":"mountain","ja":"山"}', 'nature', 1),
  ('{"ko":"폭포","en":"waterfall","ja":"滝"}', 'nature', 2),
  ('{"ko":"섬","en":"island","ja":"島"}', 'nature', 2),
  ('{"ko":"사막","en":"desert","ja":"砂漠"}', 'nature', 3),
  ('{"ko":"동굴","en":"cave","ja":"洞窟"}', 'nature', 2),
  ('{"ko":"빙산","en":"iceberg","ja":"氷山"}', 'nature', 2),
  ('{"ko":"등대","en":"lighthouse","ja":"灯台"}', 'common', 1),
  ('{"ko":"다리","en":"bridge","ja":"橋"}', 'common', 2),
  ('{"ko":"성","en":"castle","ja":"城"}', 'common', 1),
  ('{"ko":"피라미드","en":"pyramid","ja":"ピラミッド"}', 'common', 1),
  ('{"ko":"태양","en":"sun","ja":"太陽"}', 'nature', 1),
  ('{"ko":"노을","en":"sunset","ja":"夕焼け"}', 'nature', 2),
  ('{"ko":"유성","en":"shooting star","ja":"流れ星"}', 'nature', 1),
  ('{"ko":"지구","en":"earth","ja":"地球"}', 'nature', 1),
  ('{"ko":"토성","en":"saturn","ja":"土星"}', 'nature', 1),
  ('{"ko":"텐트","en":"tent","ja":"テント"}', 'common', 1),
  ('{"ko":"모닥불","en":"campfire","ja":"たき火"}', 'common', 1),
  ('{"ko":"낚싯대","en":"fishing rod","ja":"釣り竿"}', 'common', 1),
  ('{"ko":"그네","en":"swing","ja":"ブランコ"}', 'common', 1),
  ('{"ko":"시소","en":"seesaw","ja":"シーソー"}', 'common', 1),
  ('{"ko":"미끄럼틀","en":"slide","ja":"すべり台"}', 'common', 1),
  ('{"ko":"축구공","en":"soccer ball","ja":"サッカーボール"}', 'common', 1),
  ('{"ko":"농구공","en":"basketball","ja":"バスケットボール"}', 'common', 1),
  ('{"ko":"야구방망이","en":"baseball bat","ja":"バット"}', 'common', 1),
  ('{"ko":"배드민턴","en":"badminton","ja":"バドミントン"}', 'common', 2),
  ('{"ko":"볼링핀","en":"bowling pin","ja":"ボウリングのピン"}', 'common', 1),
  ('{"ko":"골프채","en":"golf club","ja":"ゴルフクラブ"}', 'common', 2),
  ('{"ko":"스케이트보드","en":"skateboard","ja":"スケートボード"}', 'common', 1),
  ('{"ko":"스키","en":"ski","ja":"スキー"}', 'common', 1),
  ('{"ko":"썰매","en":"sled","ja":"そり"}', 'common', 1),
  ('{"ko":"줄넘기","en":"jump rope","ja":"縄跳び"}', 'common', 1),
  ('{"ko":"아령","en":"dumbbell","ja":"ダンベル"}', 'common', 1),
  ('{"ko":"트로피","en":"trophy","ja":"トロフィー"}', 'common', 1),
  ('{"ko":"메달","en":"medal","ja":"メダル"}', 'common', 1),
  ('{"ko":"호루라기","en":"whistle","ja":"ホイッスル"}', 'common', 2),
  ('{"ko":"깃발","en":"flag","ja":"旗"}', 'common', 1),
  ('{"ko":"다트","en":"darts","ja":"ダーツ"}', 'common', 1),
  ('{"ko":"주사위","en":"dice","ja":"サイコロ"}', 'common', 1),
  ('{"ko":"퍼즐","en":"puzzle","ja":"パズル"}', 'common', 2),
  ('{"ko":"곰인형","en":"teddy bear","ja":"クマのぬいぐるみ"}', 'common', 1),
  ('{"ko":"팽이","en":"spinning top","ja":"コマ"}', 'common', 2),
  ('{"ko":"연","en":"kite","ja":"凧"}', 'common', 1),
  ('{"ko":"요요","en":"yo-yo","ja":"ヨーヨー"}', 'common', 2),
  ('{"ko":"풍차","en":"windmill","ja":"風車"}', 'common', 1),
  ('{"ko":"망치","en":"hammer","ja":"ハンマー"}', 'common', 1),
  ('{"ko":"톱","en":"saw","ja":"のこぎり"}', 'common', 1),
  ('{"ko":"삽","en":"shovel","ja":"シャベル"}', 'common', 1),
  ('{"ko":"빗자루","en":"broom","ja":"ほうき"}', 'common', 1),
  ('{"ko":"사다리","en":"ladder","ja":"はしご"}', 'common', 1),
  ('{"ko":"전구","en":"light bulb","ja":"電球"}', 'common', 1),
  ('{"ko":"촛불","en":"candle","ja":"ろうそく"}', 'common', 1),
  ('{"ko":"손전등","en":"flashlight","ja":"懐中電灯"}', 'common', 2),
  ('{"ko":"자석","en":"magnet","ja":"磁石"}', 'common', 1),
  ('{"ko":"돋보기","en":"magnifying glass","ja":"虫眼鏡"}', 'common', 1),
  ('{"ko":"망원경","en":"telescope","ja":"望遠鏡"}', 'common', 2),
  ('{"ko":"지도","en":"map","ja":"地図"}', 'common', 2),
  ('{"ko":"나침반","en":"compass","ja":"方位磁針"}', 'common', 2),
  ('{"ko":"지구본","en":"globe","ja":"地球儀"}', 'common', 1),
  ('{"ko":"달력","en":"calendar","ja":"カレンダー"}', 'common', 2),
  ('{"ko":"편지봉투","en":"envelope","ja":"封筒"}', 'common', 1),
  ('{"ko":"우표","en":"stamp","ja":"切手"}', 'common', 2),
  ('{"ko":"신문","en":"newspaper","ja":"新聞"}', 'common', 2),
  ('{"ko":"붓","en":"paintbrush","ja":"筆"}', 'common', 1),
  ('{"ko":"물감","en":"paint","ja":"絵の具"}', 'common', 2),
  ('{"ko":"팔레트","en":"palette","ja":"パレット"}', 'common', 1),
  ('{"ko":"크레파스","en":"crayon","ja":"クレヨン"}', 'common', 2),
  ('{"ko":"부채","en":"hand fan","ja":"うちわ"}', 'common', 1),
  ('{"ko":"향수","en":"perfume","ja":"香水"}', 'common', 2),
  ('{"ko":"립스틱","en":"lipstick","ja":"リップスティック"}', 'common', 1),
  ('{"ko":"빗","en":"comb","ja":"くし"}', 'common', 1),
  ('{"ko":"드라이기","en":"hair dryer","ja":"ドライヤー"}', 'common', 1),
  ('{"ko":"칫솔","en":"toothbrush","ja":"歯ブラシ"}', 'common', 1),
  ('{"ko":"비누","en":"soap","ja":"石けん"}', 'common', 2),
  ('{"ko":"수건","en":"towel","ja":"タオル"}', 'common', 2),
  ('{"ko":"욕조","en":"bathtub","ja":"浴槽"}', 'common', 1),
  ('{"ko":"샤워기","en":"shower","ja":"シャワー"}', 'common', 1),
  ('{"ko":"웃음","en":"laughing","ja":"笑い"}', 'hard', 3),
  ('{"ko":"울음","en":"crying","ja":"泣き"}', 'hard', 2),
  ('{"ko":"하품","en":"yawn","ja":"あくび"}', 'hard', 2),
  ('{"ko":"재채기","en":"sneeze","ja":"くしゃみ"}', 'hard', 3),
  ('{"ko":"박수","en":"clapping","ja":"拍手"}', 'hard', 2),
  ('{"ko":"악수","en":"handshake","ja":"握手"}', 'hard', 2),
  ('{"ko":"포옹","en":"hug","ja":"ハグ"}', 'hard', 2),
  ('{"ko":"윙크","en":"wink","ja":"ウインク"}', 'hard', 1),
  ('{"ko":"달리기","en":"running","ja":"かけっこ"}', 'hard', 2),
  ('{"ko":"수영","en":"swimming","ja":"水泳"}', 'hard', 2),
  ('{"ko":"낚시","en":"fishing","ja":"釣り"}', 'hard', 2),
  ('{"ko":"등산","en":"hiking","ja":"登山"}', 'hard', 2),
  ('{"ko":"요리","en":"cooking","ja":"料理"}', 'hard', 2),
  ('{"ko":"청소","en":"cleaning","ja":"掃除"}', 'hard', 2),
  ('{"ko":"빨래","en":"laundry","ja":"洗濯"}', 'hard', 2),
  ('{"ko":"공부","en":"studying","ja":"勉強"}', 'hard', 2),
  ('{"ko":"잠","en":"sleeping","ja":"睡眠"}', 'hard', 2),
  ('{"ko":"감기","en":"catching a cold","ja":"風邪"}', 'hard', 3),
  ('{"ko":"주사","en":"injection","ja":"注射"}', 'common', 1),
  ('{"ko":"붕대","en":"bandage","ja":"包帯"}', 'common', 2),
  ('{"ko":"마스크","en":"face mask","ja":"マスク"}', 'common', 1),
  ('{"ko":"체온계","en":"thermometer","ja":"体温計"}', 'common', 2),
  ('{"ko":"청진기","en":"stethoscope","ja":"聴診器"}', 'common', 2),
  ('{"ko":"반창고","en":"band-aid","ja":"絆創膏"}', 'common', 2)
on conflict do nothing;
