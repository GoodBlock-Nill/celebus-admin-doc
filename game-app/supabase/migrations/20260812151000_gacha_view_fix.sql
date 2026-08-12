-- ─────────────────────────────────────────────────────────────
-- 038-1: 가챠 공시 뷰 보정 — digital 풀에서 weight가 비워진 아이템(아카이브) 공시 제외.
--   뽑기 이력 FK 때문에 풀 아이템은 행 삭제 대신 weight=null 아카이브로 제거하므로,
--   공개 공시에서도 함께 제외해야 확률표가 실제 추첨 풀과 일치한다.
-- ─────────────────────────────────────────────────────────────

create or replace view game_gacha_event_public as
  select e.id, e.kind, e.title, e.description, e.image_url, e.starts_at, e.ends_at,
         (select coalesce(jsonb_agg(jsonb_build_object(
             'grade', p.grade, 'prize', p.prize, 'image_url', p.image_url, 'is_physical', p.is_physical,
             'weight', p.weight, 'total_qty', p.total_qty, 'remaining_qty', p.remaining_qty,
             'reward_payload', p.reward_payload, 'sort', p.sort)
             order by p.sort asc, p.grade asc), '[]'::jsonb)
          from game_gacha_pool_item p
          where p.event_id = e.id and (e.kind <> 'digital' or p.weight > 0)) as pool
  from game_gacha_event e
  where e.status = 'published'
    and (e.starts_at is null or e.starts_at <= now())
    and (e.ends_at   is null or e.ends_at   >  now());
grant select on game_gacha_event_public to anon, authenticated;

notify pgrst, 'reload schema';
