-- 013: 챌린지 이벤트 + 조회수 (CELEBUS MOMENT Phase 3)
-- 월드컵 → 챌린지 중심 전환. 챌린지는 공연(stage) 단위로 열리고, 기간 내 올라온 공개 영상이 자동 엔트리.
-- 랭킹 = 멤버 하트 + 팬 하트(좋아요) + 조회수 결합(가중치 BO 튜너블, 조회수는 로그 정규화).
-- 조회수 신설: 어뷰징 방지 중심 — 신원당 시간창(기본 30분) 1회만 집계, SECURITY DEFINER RPC로만 증가(클라 임의 증가 불가).
-- 월드컵(011)은 전환기 병행 유지 → 이후 별도 정리.

-- ── 1. 이벤트 유형 + 챌린지 설정 ─────────────────────────────
-- 기존 stage_events(전부 월드컵)는 default 'worldcup'로 보존. BO는 신규 챌린지에 type='challenge' 명시.
alter table stage_events add column if not exists type text not null default 'worldcup'
  check (type in ('worldcup','challenge'));
alter table stage_events add column if not exists submit_start_at timestamptz;  -- 챌린지 제출 시작(미지정=상시)
alter table stage_events add column if not exists submit_end_at   timestamptz;  -- 챌린지 제출 마감(미지정=상시)
-- 랭킹 가중치 (멤버 하트 비중을 팬·조회수보다 다소 높게 기본)
alter table stage_events add column if not exists rank_weights jsonb not null default '{"member":3,"fan":1,"view":1}'::jsonb;
-- 보상 목록: [{"type":"sns"|"ticket"|"goods_physical"|"goods_digital","label":{"ko":"","en":"","ja":""}}]
alter table stage_events add column if not exists rewards jsonb;

-- 공개 뷰 갱신 — 기존 컬럼 순서 유지 + 신규 컬럼은 끝에만 추가(CREATE OR REPLACE VIEW 제약)
create or replace view stage_events_public as
  select e.id, e.stage_id, s.title as stage_title, e.title, e.description, e.status, e.ends_at, e.awards, e.created_at,
         e.type, e.submit_start_at, e.submit_end_at, e.rewards
  from stage_events e
  join stages s on s.id = e.stage_id and s.hidden = false
  where e.status in ('open','announced');
grant select on stage_events_public to anon, authenticated;

-- ── 2. 조회수 추적 ──────────────────────────────────────────
alter table stage_posts add column if not exists view_count int not null default 0;

create table if not exists stage_post_views (
  post_id uuid not null references stage_posts(id) on delete cascade,
  viewer_id text not null,                         -- 신원 쿠키(cfs_vid) 또는 세션 해시
  last_viewed_at timestamptz not null default now(),
  primary key (post_id, viewer_id)
);
alter table stage_post_views enable row level security;   -- 베이스 차단, 집계는 RPC만

-- 조회 집계 RPC — 신원당 창(기본 30분) 내 1회만 view_count 증가(어뷰징 방지). 반환 {counted, view_count}
create or replace function stage_record_view(p_post uuid, p_viewer text, p_window_min int default 30)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_count int; v_last timestamptz; v_hidden boolean;
begin
  select hidden into v_hidden from stage_posts where id = p_post;
  if v_hidden is null or v_hidden then return jsonb_build_object('error','not_found'); end if;
  if p_viewer is null or length(p_viewer) = 0 then return jsonb_build_object('error','bad_viewer'); end if;

  select last_viewed_at into v_last from stage_post_views where post_id = p_post and viewer_id = p_viewer;
  if v_last is not null and v_last > now() - make_interval(mins => p_window_min) then
    select view_count into v_count from stage_posts where id = p_post;      -- 창 내 재조회 = 미집계
    return jsonb_build_object('counted', false, 'view_count', v_count);
  end if;

  insert into stage_post_views (post_id, viewer_id, last_viewed_at) values (p_post, p_viewer, now())
    on conflict (post_id, viewer_id) do update set last_viewed_at = now();
  update stage_posts set view_count = view_count + 1 where id = p_post returning view_count into v_count;
  return jsonb_build_object('counted', true, 'view_count', v_count);
end $$;
revoke execute on function stage_record_view(uuid, text, int) from public, anon, authenticated;
grant  execute on function stage_record_view(uuid, text, int) to service_role;

-- 공개 뷰에 view_count 추가 — 기존 컬럼 순서 유지 + view_count는 맨 끝에 추가
create or replace view stage_posts_public as
  select p.id, p.stage_id, p.platform, p.source_url, p.external_id, p.title, p.description,
         p.handle, p.handle_verified, p.category, p.like_count, p.created_at,
         (p.updated_at > p.created_at) as edited,
         p.oembed->>'thumbnail_url' as thumbnail_url,
         p.oembed->>'title'         as oembed_title,
         p.oembed->>'author_name'   as oembed_author,
         p.view_count
  from stage_posts p
  join stages s on s.id = p.stage_id and s.hidden = false
  where p.hidden = false;

-- ── 3. 챌린지 랭킹 뷰 (멤버 하트 + 팬 하트 + 조회수 결합) ───────
-- 조회수는 ln(views+1)로 로그 정규화해 하트류를 압도하지 않게 함. 가중치는 이벤트별 rank_weights.
create or replace view challenge_standings_public as
  select e.id as event_id, p.id as post_id, p.title, p.handle,
         p.oembed->>'thumbnail_url' as thumbnail_url,
         coalesce(mh.cnt, 0) as member_hearts,
         p.like_count       as fan_hearts,
         p.view_count       as views,
         round((
           coalesce((e.rank_weights->>'member')::numeric, 3) * coalesce(mh.cnt, 0)
         + coalesce((e.rank_weights->>'fan')::numeric,    1) * p.like_count
         + coalesce((e.rank_weights->>'view')::numeric,   1) * ln(p.view_count + 1)::numeric
         )::numeric, 4) as score
  from stage_events e
  join stage_posts p
    on p.stage_id = e.stage_id and p.hidden = false
   and (e.submit_start_at is null or p.created_at >= e.submit_start_at)
   and (e.submit_end_at   is null or p.created_at <= e.submit_end_at)
  left join (select post_id, count(*) as cnt from member_hearts group by post_id) mh on mh.post_id = p.id
  where e.type = 'challenge' and e.status in ('open','announced');
grant select on challenge_standings_public to anon, authenticated;
