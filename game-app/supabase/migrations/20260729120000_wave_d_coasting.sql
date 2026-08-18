-- ─────────────────────────────────────────────────────────────
-- 030: Wave D — 순항 구간(성과 연동 관용) 서버 판정 (피로감 개선 트랙 2단계)
--   배경: 매판 최대 노력 요구가 번아웃의 구조적 원인 → 하루의 진입 장벽을 낮추고
--   좌절의 바닥을 잘라내는 관용 장치. 전부 config coasting으로 라이브 튜닝(0=끔).
--   ① 웜업: 오늘(KST) 첫 일반 매치 판 시작 시간 보너스 — 전원 하루 1회 동일(랭킹 공정성 유지)
--   ② 스트릭 부스터: 출석 연속 3일+/7일+ 시 일반 매치 시작 시간 보너스 (사용자 결정: 일반 매치 포함)
--   ③ 라스트 스퍼트(막판 구원)는 클라이언트 판정 — 서버 변경 없음
--   game_start_match 재작성: 시그니처·기존 동작 동일 유지 + 반환 jsonb에 보너스 키 추가(additive —
--   구 클라이언트는 추가 키를 무시하므로 안전).
-- ─────────────────────────────────────────────────────────────

create or replace function game_start_match(p_player_hash text, p_mode text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_seed       bigint;
  v_id         uuid;
  v_cfg        jsonb;
  v_kst_today  date := (now() at time zone 'Asia/Seoul')::date;
  v_warm_sec   int := 0;
  v_streak_sec int := 0;
  v_streak     int := 0;
  v_last       date;
  v_w int; v_t1d int; v_t1s int; v_t2d int; v_t2s int;
begin
  if p_mode not in ('daily', 'free') then return jsonb_build_object('error', 'bad_mode'); end if;
  if not exists (select 1 from game_profiles where player_hash = p_player_hash) then
    return jsonb_build_object('error', 'no_profile');
  end if;

  -- 일반매치는 전원 동일 보드(KST 날짜 시드), 아이템매치는 판별 랜덤 시드
  if p_mode = 'daily' then
    v_seed := to_char((now() at time zone 'Asia/Seoul'), 'YYYYMMDD')::bigint;
  else
    v_seed := floor(random() * 2147483647)::bigint;
  end if;

  -- 순항 보너스 — 일반 매치 한정
  if p_mode = 'daily' then
    select config into v_cfg from game_config where id = 1;
    v_w   := coalesce((v_cfg#>>'{coasting,warmupSec}')::int, 15);
    v_t1d := coalesce((v_cfg#>>'{coasting,streakT1Days}')::int, 3);
    v_t1s := coalesce((v_cfg#>>'{coasting,streakT1Sec}')::int, 5);
    v_t2d := coalesce((v_cfg#>>'{coasting,streakT2Days}')::int, 7);
    v_t2s := coalesce((v_cfg#>>'{coasting,streakT2Sec}')::int, 10);

    -- 웜업: 오늘(KST) 일반 매치 제출이 아직 없으면 첫 판 보너스
    if v_w > 0 and not exists (
      select 1 from game_scores
      where player_hash = p_player_hash and mode = 'daily'
        and created_at >= (v_kst_today::timestamp at time zone 'Asia/Seoul')
    ) then v_warm_sec := v_w; end if;

    -- 출석 스트릭 부스터: 마지막 출석이 오늘/어제면 스트릭 유효
    select streak, last_claim_date into v_streak, v_last
    from game_daily_claim where player_hash = p_player_hash;
    v_streak := coalesce(v_streak, 0);
    if v_last is null or v_last < v_kst_today - 1 then v_streak := 0; end if;
    if v_streak >= v_t2d and v_t2s > 0 then v_streak_sec := v_t2s;
    elsif v_streak >= v_t1d and v_t1s > 0 then v_streak_sec := v_t1s;
    end if;
  end if;

  insert into game_match (player_hash, mode, seed)
  values (p_player_hash, p_mode, v_seed)
  returning match_id into v_id;

  return jsonb_build_object('match_id', v_id, 'seed', v_seed,
                            'warmup_sec', v_warm_sec, 'streak_sec', v_streak_sec, 'streak_days', v_streak);
end $$;

revoke execute on function game_start_match(text, text) from public, anon, authenticated;
grant  execute on function game_start_match(text, text) to service_role;

notify pgrst, 'reload schema';
